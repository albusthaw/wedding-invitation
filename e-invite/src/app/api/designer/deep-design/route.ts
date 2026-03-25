import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml, sanitizeCss } from "@/lib/sanitize";
import { writeFile, mkdir } from "fs/promises";

// Allow up to 5 minutes for the deep design pipeline
export const maxDuration = 300;
import { join } from "path";
import crypto from "crypto";

/**
 * Deep Design Pipeline — 3-phase AI design generation
 *
 * Phase 1 (PLANNING):  Text model iterates back-and-forth (up to 15 turns)
 *   planning which design elements are needed until it outputs "OPTIMAL".
 * Phase 2 (IMAGE GEN): Image model generates each planned element, returns
 *   urls + size/position metadata.
 * Phase 3 (ASSEMBLY):  Text model receives all generated images + metadata
 *   and produces the final comprehensive CSS/HTML design config.
 *
 * Total expected time: 30s – 5min depending on complexity.
 */

async function saveImageFromBase64(data: string, mimeType: string): Promise<string> {
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const uploadDir = join(process.cwd(), "public", "uploads", "photos");
  await mkdir(uploadDir, { recursive: true });
  const fileName = `ai-${crypto.randomUUID()}.${ext}`;
  await writeFile(join(uploadDir, fileName), Buffer.from(data, "base64"));
  return `/uploads/photos/${fileName}`;
}

// Sentinel keyword the AI must say when its plan is complete
const OPTIMAL_KEYWORD = "OPTIMAL";
const MAX_PLAN_TURNS = 15;
const DESIGN_START_TURN = 10; // force finalize after this many turns

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { prompt, invitationId, currentConfig, galleryPhotos, mode } = body;

    if (!prompt || !invitationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Load settings
    const [apiKeySetting, textModelSetting, imageModelSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "geminiApiKey" } }),
      prisma.setting.findUnique({ where: { key: "geminiModel" } }),
      prisma.setting.findUnique({ where: { key: "geminiImageModel" } }),
    ]);

    const apiKey = apiKeySetting?.value;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 400 });
    }

    const textModel = textModelSetting?.value || "gemini-3.1-flash-lite-preview";
    const imageModel = imageModelSetting?.value || "gemini-3.1-flash-image-preview";

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const phases: { phase: string; detail: string }[] = [];
    const addLog = (phase: string, detail: string) => { phases.push({ phase, detail }); };

    // ─── PHASE 1: PLANNING (back-and-forth conversation) ───────────
    addLog("plan", "Starting design planning...");

    const isEnvelope = mode === "envelope";
    const targetDesc = isEnvelope ? "envelope opener page" : "wedding invitation page";
    const photoContext = galleryPhotos?.length > 0
      ? `\nAvailable photos: ${galleryPhotos.map((p: string, i: number) => `PHOTO_${i}=${p}`).join(", ")}`
      : "";

    const planSystemPrompt = `You are an expert wedding invitation designer planning a COMPLETE ${targetDesc} redesign.

The user wants: "${prompt}"
${photoContext}

Your job is to have an internal planning conversation. In each turn:
1. List design elements needed (decorative images, patterns, borders, motifs, icons)
2. Describe the color palette, typography, and animation concepts
3. For each image element, specify: what it is, recommended size (e.g. 200x200, 400x100), position (e.g. top-left corner, header background, between sections), and visual style

When your plan is COMPLETE and covers all necessary elements, end your response with the word "${OPTIMAL_KEYWORD}" on its own line.

If you need more thought, do NOT say ${OPTIMAL_KEYWORD} — instead continue refining.

IMPORTANT: You MUST eventually say ${OPTIMAL_KEYWORD}. By turn ${DESIGN_START_TURN}, you MUST finalize and say ${OPTIMAL_KEYWORD}.

After ${OPTIMAL_KEYWORD}, output a JSON array of image elements to generate:
[{"prompt":"detailed image prompt","description":"short label","width":200,"height":200,"position":"top-left corner overlay","cssPlacement":"position:absolute;top:20px;left:20px;width:200px;opacity:0.8"}]`;

    const conversationHistory: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    conversationHistory.push({ role: "user", parts: [{ text: planSystemPrompt }] });

    let planComplete = false;
    let imageElements: { prompt: string; description: string; width: number; height: number; position: string; cssPlacement: string }[] = [];
    let planSummary = "";

    for (let turn = 0; turn < MAX_PLAN_TURNS; turn++) {
      const planRes = await ai.models.generateContent({
        model: textModel,
        contents: conversationHistory,
      });

      const planText = planRes.text || "";
      conversationHistory.push({ role: "model", parts: [{ text: planText }] });

      addLog("plan", `Turn ${turn + 1}: ${planText.slice(0, 150)}...`);
      planSummary = planText;

      if (planText.includes(OPTIMAL_KEYWORD) || turn >= DESIGN_START_TURN - 1) {
        // Extract JSON array of elements
        const arrMatch = planText.match(/\[[\s\S]*\]/);
        if (arrMatch) {
          try {
            imageElements = JSON.parse(arrMatch[0]);
          } catch {
            imageElements = [];
          }
        }

        // If no elements parsed, create defaults from the plan text
        if (imageElements.length === 0) {
          imageElements = [
            { prompt: `Wedding decorative element for ${prompt}, elegant style, transparent background`, description: "Main decoration", width: 300, height: 300, position: "header", cssPlacement: "position:absolute;top:0;left:50%;transform:translateX(-50%);width:300px;opacity:0.7" },
            { prompt: `Ornamental border element for ${prompt}, gold accents, transparent background`, description: "Border ornament", width: 400, height: 100, position: "divider", cssPlacement: "width:100%;max-width:400px;margin:0 auto;opacity:0.6" },
            { prompt: `Small decorative motif for ${prompt}, minimalist, transparent background`, description: "Corner motif", width: 150, height: 150, position: "corners", cssPlacement: "position:absolute;width:150px;opacity:0.5" },
          ];
        }

        planComplete = true;
        addLog("plan", `Planning complete after ${turn + 1} turns. ${imageElements.length} elements planned.`);
        break;
      }

      // Continue the conversation — ask AI to refine
      conversationHistory.push({
        role: "user",
        parts: [{ text: `Continue refining. Consider: animations, transitions, color harmony, cultural authenticity. Are all decorative elements covered? When ready, say ${OPTIMAL_KEYWORD} and output the JSON array.` }],
      });
    }

    if (!planComplete) {
      addLog("plan", "Forcing plan finalization at max turns.");
    }

    // Cap elements
    imageElements = imageElements.slice(0, 8);

    // ─── PHASE 2: IMAGE GENERATION ─────────────────────────────────
    addLog("images", `Generating ${imageElements.length} design elements...`);

    const generatedImages: { url: string; description: string; width: number; height: number; position: string; cssPlacement: string }[] = [];

    for (let i = 0; i < imageElements.length; i++) {
      const el = imageElements[i];
      addLog("images", `Generating ${i + 1}/${imageElements.length}: ${el.description}`);

      try {
        const imgRes = await ai.models.generateContent({
          model: imageModel,
          contents: [{ role: "user", parts: [{ text: `Create a high-quality wedding design element: ${el.prompt}. Size approximately ${el.width}x${el.height}px.` }] }],
          config: { responseModalities: ["TEXT", "IMAGE"] },
        });

        const candidate = imgRes.candidates?.[0];
        if (!candidate?.content?.parts) continue;

        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            const url = await saveImageFromBase64(part.inlineData.data, part.inlineData.mimeType || "image/png");
            generatedImages.push({ url, description: el.description, width: el.width, height: el.height, position: el.position, cssPlacement: el.cssPlacement });
            break;
          }
        }
      } catch (err) {
        console.error(`Image gen failed for "${el.description}":`, err);
        addLog("images", `Failed: ${el.description}`);
      }
    }

    addLog("images", `Generated ${generatedImages.length}/${imageElements.length} images.`);

    // ─── PHASE 3: DESIGN ASSEMBLY ──────────────────────────────────
    addLog("design", "Assembling final design with generated elements...");

    // Build image catalog for the text model
    const imageCatalog = generatedImages.map((img, i) => (
      `IMAGE_${i}: url="${img.url}", description="${img.description}", size=${img.width}x${img.height}, position="${img.position}", suggestedCss="${img.cssPlacement}"`
    )).join("\n");

    const designTarget = isEnvelope ? "envelope" : "invitation page";

    const assemblyPrompt = `You are an expert wedding ${designTarget} designer. You have been given AI-generated design element images. Your job is to create a COMPLETE, STUNNING design that incorporates ALL these elements.

## Generated Design Elements
${imageCatalog}

## User Request
"${prompt}"

## Current Config
${JSON.stringify(currentConfig, null, 2)}
${photoContext}

## Your Task
Create a comprehensive design config JSON that:
1. Uses ALL generated images (reference them by their url in customCss and customHtml)
2. Creates matching color palette, fonts, and animations
3. Positions each image element where specified using CSS
4. Adds @keyframes animations (float, shimmer, fadeIn, pulse, etc.)
5. Creates a cohesive theme that ties everything together
6. Includes custom HTML with the image elements placed correctly
7. Does NOT just change background color — this must be a FULL redesign

## JSON Format
{
  "primaryFont": "Font name",
  "backgroundColor": "#hex",
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "textColor": "#hex",
  ${isEnvelope ? '"envelopeBgColor": "#hex dark",\n  "envelopePaperColor": "#hex light",\n  "envelopeTextColor": "#hex",' : '"enableGallery": true,\n  "enableRsvp": true,\n  "enableCountdown": true,\n  "enableMessages": true,'}
  "customCss": "EXTENSIVE CSS with @keyframes, image positioning, gradients, text effects, animations, transitions. Reference image URLs directly in background-image or as img elements in customHtml. Make it STUNNING.",
  "customHtml": "HTML elements that position the generated images on the page. Use <img> tags with the image URLs, styled with position:absolute or as decorative overlays. Include animated containers."
}

RULES:
1. Return ONLY valid JSON
2. ALL colors as #RRGGBB
3. MUST use the generated image URLs in customCss and/or customHtml
4. customCss MUST include at least 2 @keyframes animations
5. customHtml MUST include at least the generated images positioned on the page
6. This is a COMPLETE redesign — change everything to match the theme`;

    const designRes = await ai.models.generateContent({
      model: textModel,
      contents: [{ role: "user", parts: [{ text: assemblyPrompt }] }],
    });

    const designText = designRes.text || "";
    addLog("design", "Design config generated, validating...");

    // Parse and validate the config
    let config: Record<string, unknown> = {};
    let galleryOrder: number[] | undefined;

    try {
      const jsonMatch = designText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in design response");
      config = JSON.parse(jsonMatch[0]);

      if (Array.isArray(config.galleryOrder)) {
        galleryOrder = config.galleryOrder as number[];
        delete config.galleryOrder;
      }

      // Replace PHOTO_N references
      if (galleryPhotos?.length > 0) {
        for (const field of ["customCss", "customHtml", "backgroundImage"]) {
          if (typeof config[field] === "string") {
            let val = config[field] as string;
            for (let i = 0; i < galleryPhotos.length; i++) {
              val = val.replace(new RegExp(`PHOTO_${i}`, "g"), galleryPhotos[i]);
            }
            config[field] = val;
          }
        }
      }

      // Validate colors
      const colorFields = ["backgroundColor", "primaryColor", "accentColor", "textColor",
        "envelopeBgColor", "envelopePaperColor", "envelopeTextColor"];
      for (const f of colorFields) {
        if (config[f] && (typeof config[f] !== "string" || !/^#[0-9a-fA-F]{3,8}$/.test(config[f] as string))) {
          config[f] = (currentConfig as Record<string, unknown>)?.[f];
        }
      }

      if (typeof config.primaryFont !== "string" || !config.primaryFont) {
        config.primaryFont = currentConfig?.primaryFont;
      }

      for (const f of ["enableGallery", "enableRsvp", "enableCountdown", "enableMessages"]) {
        if (config[f] !== undefined && typeof config[f] !== "boolean") {
          config[f] = (currentConfig as Record<string, unknown>)?.[f] ?? true;
        }
      }

      for (const key of Object.keys(config)) {
        if (config[key] === undefined) delete config[key];
      }

      // Sanitize
      if (typeof config.customHtml === "string" && config.customHtml) {
        config.customHtml = sanitizeHtml(config.customHtml);
      }
      if (typeof config.customCss === "string" && config.customCss) {
        config.customCss = sanitizeCss(config.customCss);
      }
    } catch {
      addLog("design", "Failed to parse design JSON, using raw plan");
      return NextResponse.json({
        error: "Design assembly failed. Try again.",
        phases,
        rawResponse: designText.slice(0, 500),
      }, { status: 422 });
    }

    // Mark needsRepublish
    const inv = await prisma.invitationLetter.findUnique({
      where: { id: invitationId }, select: { published: true },
    });
    if (inv?.published) {
      await prisma.invitationLetter.update({
        where: { id: invitationId }, data: { needsRepublish: true },
      });
    }

    addLog("design", "Design assembly complete!");

    // Build summary
    const changes: string[] = [];
    const cur = (currentConfig || {}) as Record<string, unknown>;
    if (config.primaryFont && config.primaryFont !== cur.primaryFont) changes.push(`Font → ${config.primaryFont}`);
    if (config.backgroundColor && config.backgroundColor !== cur.backgroundColor) changes.push(`Background → ${config.backgroundColor}`);
    if (config.primaryColor && config.primaryColor !== cur.primaryColor) changes.push(`Primary → ${config.primaryColor}`);
    if (config.accentColor && config.accentColor !== cur.accentColor) changes.push(`Accent → ${config.accentColor}`);
    if (config.customCss && config.customCss !== cur.customCss) changes.push("Complete CSS overhaul (animations, image placement, effects)");
    if (config.customHtml && config.customHtml !== cur.customHtml) changes.push(`Custom HTML with ${generatedImages.length} design elements`);

    return NextResponse.json({
      config,
      galleryOrder,
      images: generatedImages,
      phases,
      message: `Deep design complete!\n• ${generatedImages.length} AI images generated\n• ${changes.join("\n• ")}\n\nClick "Apply" to preview.`,
    });
  } catch (error) {
    console.error("Deep design error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Deep design failed: ${msg}` }, { status: 500 });
  }
}

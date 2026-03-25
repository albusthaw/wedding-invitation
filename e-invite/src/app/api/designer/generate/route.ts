import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;
import { sanitizeHtml, sanitizeCss } from "@/lib/sanitize";

const COMPREHENSIVE_ENVELOPE_PROMPT = `You are an expert wedding invitation ENVELOPE designer. You COMPLETELY redesign the envelope — colors, layout, animations, custom CSS, custom HTML.

## Envelope Elements
- **Background**: Radial gradient (envelopeBgColor — must be DARK)
- **Paper**: Gradient paper (envelopePaperColor — must be LIGHT)
- **Text**: Couple names, greeting (envelopeTextColor — dark on paper)
- **Button**: "Open Invitation" (primaryColor)
- **Wax Seal**: Heart seal (primaryColor)
- **Font**: primaryFont for all text
- **Decorations**: Gold accent borders, LOVE stamp, floating particles
- **customCss**: Inject CSS for gradients, text-shadow, glow, @keyframes animations. Target: .fixed.inset-0 (container), h1 (names), button (open btn)
- **customHtml**: Inject HTML for floating petals, sparkles, decorative frames

## CRITICAL: If user uploads photos (PHOTO_N), use them as decorative overlays in customCss/customHtml, NOT as the main background. Example: img tags in customHtml positioned absolutely as corner decorations.

## JSON (return ALL fields)
{
  "primaryFont": "from: Great Vibes, Dancing Script, Sacramento, Alex Brush, Satisfy, Tangerine, Parisienne, Allura, Playfair Display, Cormorant Garamond, Lora, Cinzel, Libre Baskerville, EB Garamond, Montserrat, Raleway, Josefin Sans, Poppins, Quicksand",
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "envelopeBgColor": "#hex DARK",
  "envelopePaperColor": "#hex LIGHT",
  "envelopeTextColor": "#hex dark text",
  "customCss": "CSS with @keyframes, gradients, text-shadow, backdrop-filter, glow effects",
  "customHtml": "HTML for floating elements, decorative SVGs, sparkle divs"
}

## RULES
1. Return ONLY valid JSON — no markdown, no backticks
2. All colors #RRGGBB hex
3. Be CREATIVE with CSS animations, gradients, text effects
4. envelopeBgColor=DARK, envelopePaperColor=LIGHT always
5. Photos (PHOTO_N) go in customHtml as decorative img overlays, NEVER as main background
6. Only change what user asks unless they say "complete redesign"`;

const COMPREHENSIVE_INVITATION_PROMPT = `You are an expert wedding invitation PAGE designer. You COMPLETELY redesign the page — colors, fonts, animations, CSS, HTML, photo integration.

## Page Sections (top to bottom)
1. **Hero** — Full viewport. Couple names, title, date. Background = backgroundColor. Add gradient overlays, parallax via customCss.
2. **Wedding Details** — Couple photos, names, date/time, venue. Uses accentColor.
3. **Countdown Timer** — Days/hours/minutes/seconds.
4. **Photo Gallery** — Grid of uploaded photos. Keep enableGallery=true so photos show in the gallery grid.
5. **RSVP Form** — Name, Accept/Decline, guests, message.
6. **Message Wall** — Blessings ticker + Send button.
7. **Footer** — Couple names.

## Photo References (PHOTO_N)
Gallery photos indexed by number. Use in customCss/customHtml:
- Section background: \`section:nth-child(2) { background: linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)), url(PHOTO_0); background-size:cover; }\`
- Decorative overlay: \`<img src="PHOTO_1" style="position:absolute;top:0;right:0;width:150px;opacity:0.3" />\`

## CRITICAL RULES FOR PHOTOS
- When user says "add to gallery" → keep enableGallery=true, do NOT put in backgroundImage
- When user says "use as background" → put in backgroundImage or customCss background
- When user says "add text overlay on photo" → use customCss to overlay text on a section with photo background
- NEVER replace the entire page background with a user's photo unless explicitly asked
- Gallery photos should stay IN the gallery grid section by default

## JSON (return ALL fields)
{
  "primaryFont": "Font name",
  "backgroundColor": "#hex",
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "textColor": "#hex",
  "backgroundImage": "URL or empty — only set if user explicitly asks for page background image",
  "enableGallery": true,
  "enableRsvp": true,
  "enableCountdown": true,
  "enableMessages": true,
  "customCss": "CSS with @keyframes, section backgrounds via PHOTO_N, text-shadow, gradients, parallax, transitions",
  "customHtml": "HTML for floating elements, decorative images, animated borders",
  "galleryOrder": [0,1,2,3]
}

## CSS Examples
- Parallax: \`.min-h-dvh { background-attachment:fixed; background-size:cover; }\`
- Photo section: \`section:nth-child(2) { background: linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.6)), url(PHOTO_0); background-size:cover; }\`
- Gold shimmer: \`h1 { background: linear-gradient(to right, #c9a96e, #f5e6d0, #c9a96e); -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s infinite; }\`
- Floating: \`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }\`

## RULES
1. Return ONLY valid JSON — no markdown, no backticks
2. All colors #RRGGBB hex
3. Be BOLD — animations, gradients, parallax, text effects
4. Use PHOTO_N for gallery photos in CSS/HTML (auto-replaced with real URLs)
5. Don't break responsive layout
6. For complete theme redesigns: change ALL colors + font + customCss together
7. enableGallery must stay true unless user specifically disables it`;

const SIMPLE_ENVELOPE_PROMPT = `You are a wedding envelope color/font designer. ONLY change colors and fonts.

## JSON
{
  "primaryFont": "from: Great Vibes, Dancing Script, Sacramento, Alex Brush, Satisfy, Tangerine, Parisienne, Allura, Playfair Display, Cormorant Garamond, Lora, Cinzel, Libre Baskerville, Montserrat, Raleway, Poppins, Quicksand",
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "envelopeBgColor": "#hex dark",
  "envelopePaperColor": "#hex light",
  "envelopeTextColor": "#hex dark text"
}
RULES: Return ONLY JSON. Only colors and font. No customCss, no customHtml.`;

const SIMPLE_INVITATION_PROMPT = `You are a wedding color/font designer. ONLY change colors, fonts, toggles.

## JSON
{
  "primaryFont": "from: Great Vibes, Dancing Script, Sacramento, Alex Brush, Satisfy, Tangerine, Parisienne, Allura, Playfair Display, Cormorant Garamond, Lora, Cinzel, Libre Baskerville, Montserrat, Raleway, Poppins, Quicksand",
  "backgroundColor": "#hex",
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "textColor": "#hex",
  "enableGallery": true,
  "enableRsvp": true,
  "enableCountdown": true,
  "enableMessages": true
}
RULES: Return ONLY JSON. Only colors, font, booleans. No customCss, no customHtml, no backgroundImage.`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { prompt, invitationId, currentConfig, galleryPhotos, mode, comprehensive } = body;

    if (!prompt || !invitationId) {
      return NextResponse.json({ error: "Missing prompt or invitationId" }, { status: 400 });
    }

    const apiKeySetting = await prisma.setting.findUnique({ where: { key: "geminiApiKey" } });
    const modelSetting = await prisma.setting.findUnique({ where: { key: "geminiModel" } });
    const apiKey = apiKeySetting?.value;
    const model = modelSetting?.value || "gemini-3.1-flash-lite-preview";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Go to Settings to add it." },
        { status: 400 }
      );
    }

    let systemPrompt: string;
    if (mode === "envelope") {
      systemPrompt = comprehensive ? COMPREHENSIVE_ENVELOPE_PROMPT : SIMPLE_ENVELOPE_PROMPT;
    } else {
      systemPrompt = comprehensive ? COMPREHENSIVE_INVITATION_PROMPT : SIMPLE_INVITATION_PROMPT;
    }

    // Build context with clear photo instructions
    let context = `\n\nCurrent config:\n${JSON.stringify(currentConfig, null, 2)}`;
    if (galleryPhotos?.length > 0) {
      context += `\n\nGallery photos available (use PHOTO_N in customCss/customHtml to reference):\n${galleryPhotos.map((p: string, i: number) => `PHOTO_${i} = ${p}`).join("\n")}`;
      context += `\n\nREMINDER: These photos are already in the gallery grid. Do NOT move them to backgroundImage unless the user explicitly says "use as background". If user says "add to gallery", just keep enableGallery=true.`;
    }

    const fullPrompt = systemPrompt + context + "\n\nUser request: " + prompt;

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    // Multi-turn refinement: if comprehensive and it's a major redesign, iterate
    let finalText = "";
    const isMajorRedesign = comprehensive && /\b(complete|entire|whole|full|redesign|overhaul|chinese|japanese|indian|traditional|theme)\b/i.test(prompt);

    if (isMajorRedesign) {
      // Step 1: Ask AI to plan the design
      const planPrompt = `${systemPrompt}\n\nThe user wants a COMPLETE redesign: "${prompt}"\n\nFirst, describe your design plan in 2-3 sentences, then output the JSON config. Think about:\n- Color palette that fits the theme\n- Font that matches the cultural/aesthetic style\n- CSS animations and effects\n- How to use available photos (if any)\n- Decorative HTML elements\n\nThen output the full JSON config.${context}`;

      const planRes = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: planPrompt }] }],
      });
      const planText = planRes.text || "";

      // Step 2: Refine the design with self-critique
      const refinePrompt = `You are reviewing a wedding invitation design. Here is the initial design response:\n\n${planText}\n\nRefine this design to be more cohesive and stunning. Ensure:\n1. Colors work harmoniously together\n2. CSS animations are smooth and elegant\n3. customHtml decorative elements complement the theme\n4. The design fully captures the "${prompt}" aesthetic\n\nReturn the FINAL improved JSON config only. No markdown, no backticks, just the JSON object.`;

      const refineRes = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: refinePrompt }] }],
      });
      finalText = refineRes.text || planText;
    } else {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      });
      finalText = response.text || "";
    }

    let config: Record<string, unknown>;
    let galleryOrder: number[] | undefined;

    try {
      const jsonMatch = finalText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
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

      // Validate hex colors
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

      if (config.backgroundImage !== undefined && typeof config.backgroundImage !== "string") {
        config.backgroundImage = currentConfig?.backgroundImage || "";
      }
      if (config.customCss !== undefined && typeof config.customCss !== "string") {
        config.customCss = currentConfig?.customCss || "";
      }
      if (config.customHtml !== undefined && typeof config.customHtml !== "string") {
        config.customHtml = currentConfig?.customHtml || "";
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
      return NextResponse.json({
        error: "AI returned invalid response. Try rephrasing your request.",
        rawResponse: finalText.slice(0, 500),
      }, { status: 422 });
    }

    // Mark as needing republish
    const inv = await prisma.invitationLetter.findUnique({
      where: { id: invitationId }, select: { published: true },
    });
    if (inv?.published) {
      await prisma.invitationLetter.update({
        where: { id: invitationId }, data: { needsRepublish: true },
      });
    }

    // Build summary
    const cur = (currentConfig || {}) as Record<string, unknown>;
    const changes: string[] = [];
    if (config.primaryFont && config.primaryFont !== cur.primaryFont) changes.push(`Font → ${config.primaryFont}`);
    if (config.backgroundColor && config.backgroundColor !== cur.backgroundColor) changes.push(`Background → ${config.backgroundColor}`);
    if (config.primaryColor && config.primaryColor !== cur.primaryColor) changes.push(`Primary → ${config.primaryColor}`);
    if (config.accentColor && config.accentColor !== cur.accentColor) changes.push(`Accent → ${config.accentColor}`);
    if (config.textColor && config.textColor !== cur.textColor) changes.push(`Text → ${config.textColor}`);
    if (config.envelopeBgColor && config.envelopeBgColor !== cur.envelopeBgColor) changes.push(`Envelope bg → ${config.envelopeBgColor}`);
    if (config.customCss && config.customCss !== cur.customCss) changes.push("Custom CSS" + (comprehensive ? " (with animations)" : ""));
    if (config.customHtml && config.customHtml !== cur.customHtml) changes.push("Custom HTML elements");
    if (galleryOrder) changes.push("Gallery reordered");

    const message = changes.length > 0
      ? `${isMajorRedesign ? "Complete redesign" : comprehensive ? "Comprehensive" : "Style"} changes:\n${changes.map(c => `• ${c}`).join("\n")}\n\nClick "Apply" to preview.`
      : "Design ready. Click \"Apply\" to see changes.";

    return NextResponse.json({ config, galleryOrder, message });
  } catch (error) {
    console.error("Designer generate error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Design failed: ${msg}` }, { status: 500 });
  }
}

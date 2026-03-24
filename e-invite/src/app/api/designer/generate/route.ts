import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Comprehensive mode: AI can rewrite entire page structure, generate custom CSS/JS/animations
const COMPREHENSIVE_ENVELOPE_PROMPT = `You are an expert wedding invitation ENVELOPE designer. You can COMPLETELY redesign the envelope page from scratch — colors, layout effects, animations, custom CSS, and custom JavaScript.

## Current Envelope Elements You Control
- **Background**: Dark radial gradient behind envelope (envelopeBgColor)
- **Envelope Paper**: Gradient paper (envelopePaperColor)
- **Text**: Couple names, greeting (envelopeTextColor)
- **Button**: "Open Invitation" uses primaryColor
- **Wax Seal**: Uses primaryColor
- **Font**: primaryFont for all text
- **Decorative elements**: Gold accent borders, LOVE stamp, particles
- **Custom CSS**: You can inject CSS to dramatically alter the envelope appearance — gradients, backgrounds, borders, text effects, glow, shadows
- **Custom HTML**: You can inject custom HTML after the envelope for extra animated elements (floating petals, sparkles, decorative frames)

## JSON to return (ALL fields)
{
  "primaryFont": "Font from: Great Vibes, Dancing Script, Sacramento, Alex Brush, Satisfy, Tangerine, Parisienne, Allura, Playfair Display, Cormorant Garamond, Lora, Cinzel, Libre Baskerville, EB Garamond, Montserrat, Raleway, Josefin Sans, Poppins, Quicksand",
  "primaryColor": "#hex - button and seal color",
  "accentColor": "#hex - decorative accent",
  "envelopeBgColor": "#hex - dark bg behind envelope",
  "envelopePaperColor": "#hex - light envelope paper",
  "envelopeTextColor": "#hex - dark text on paper",
  "customCss": "CSS string - can include @keyframes, gradients, text-shadow, box-shadow, backdrop-filter, transform effects. Target: .fixed.inset-0 (envelope container), h1 (names), button (open btn). Be creative with animations!",
  "customHtml": "HTML string - optional extra animated elements like floating SVG petals, sparkle divs with CSS animations, decorative borders. Keep it lightweight."
}

## RULES
1. Return ONLY valid JSON — no markdown, no backticks
2. All colors: #RRGGBB hex
3. Be CREATIVE — use CSS animations, gradients, text-shadow, backdrop-filter
4. customCss can include @keyframes for floating particles, shimmer effects, etc.
5. customHtml should be self-contained (inline styles or classes defined in customCss)
6. envelopeBgColor=dark, envelopePaperColor=light
7. Only change what user asks, keep rest same`;

const COMPREHENSIVE_INVITATION_PROMPT = `You are an expert wedding invitation PAGE designer. You can COMPLETELY redesign the entire invitation page from scratch — colors, fonts, layout, animations, custom CSS, custom JavaScript, photo placement, text overlays on images, and dynamic elements.

## Page Sections (top to bottom)
1. **Hero** — Full viewport. Couple names in primaryFont, title, wedding date. Background uses backgroundColor. You can add background images, gradient overlays, parallax effects via customCss.
2. **Wedding Details** — Circular couple photos, names, date/time columns, venue. Uses accentColor for dividers/ornaments.
3. **Countdown Timer** — Days/hours/minutes/seconds. Uses accent and text colors.
4. **Photo Gallery** — Grid of up to 6 uploaded photos. You can reference photos by index: photo[0], photo[1], etc.
5. **RSVP Form** — Name, Accept/Decline, guest count, message. Button uses primaryColor.
6. **Message Wall** — Floating bottom-left ticker + Send Blessing button.
7. **Footer** — Couple names.

## Photo References
Gallery photos are indexed 0-5. You can use them in customCss as backgrounds:
- \`.hero-bg { background-image: url(PHOTO_0); }\` → replaced with actual photo URL
- \`.section-bg { background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(PHOTO_1); }\`
- Photos can be used as section backgrounds with text overlays

## JSON to return (ALL fields)
{
  "primaryFont": "Font name",
  "backgroundColor": "#hex",
  "primaryColor": "#hex - buttons, interactive",
  "accentColor": "#hex - decorative, dividers, gold",
  "textColor": "#hex - body text",
  "backgroundImage": "URL or empty or PHOTO_N reference",
  "enableGallery": true,
  "enableRsvp": true,
  "enableCountdown": true,
  "enableMessages": true,
  "customCss": "COMPREHENSIVE CSS — include @keyframes for animations, section backgrounds using PHOTO_N, text-shadow, gradients, backdrop-filter, transform, transition effects. Make it stunning!",
  "customHtml": "Extra HTML — floating elements, decorative SVGs, animated borders. Can use PHOTO_N in img src.",
  "galleryOrder": [0,1,2,3,4,5]
}

## Creative CSS Examples
- Parallax hero: \`.min-h-dvh { background-attachment: fixed; background-size: cover; }\`
- Photo as section bg with text overlay: \`section:nth-child(2) { background: linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.6)), url(PHOTO_0); background-size: cover; }\`
- Animated gradient: \`@keyframes gradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }\`
- Floating particles: inject divs in customHtml with CSS @keyframes float animation
- Gold shimmer text: \`h1 { background: linear-gradient(to right, #c9a96e, #f5e6d0, #c9a96e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 3s infinite; }\`

## RULES
1. Return ONLY valid JSON — no markdown, no backticks
2. All colors: #RRGGBB hex
3. Be BOLD and CREATIVE — animations, gradients, parallax, text effects
4. Use PHOTO_N (N=0-5) to reference gallery photos in CSS/HTML — they get replaced with actual URLs
5. customCss should not break the responsive layout
6. For theme overhauls: change ALL colors + font + customCss together
7. customHtml for extra floating/animated elements (keep lightweight)`;

// Simple mode: only fonts and colors, no custom CSS/HTML/JS
const SIMPLE_ENVELOPE_PROMPT = `You are a wedding envelope color/font designer. You ONLY change colors and fonts — nothing else.

## JSON to return
{
  "primaryFont": "Font name from: Great Vibes, Dancing Script, Sacramento, Alex Brush, Satisfy, Tangerine, Parisienne, Allura, Playfair Display, Cormorant Garamond, Lora, Cinzel, Libre Baskerville, Montserrat, Raleway, Poppins, Quicksand",
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "envelopeBgColor": "#hex - dark",
  "envelopePaperColor": "#hex - light",
  "envelopeTextColor": "#hex - dark text on paper"
}

RULES: Return ONLY JSON. Only colors and font. No customCss, no customHtml.`;

const SIMPLE_INVITATION_PROMPT = `You are a wedding invitation color/font designer. You ONLY change colors, fonts, and section toggles — nothing else.

## JSON to return
{
  "primaryFont": "Font name from: Great Vibes, Dancing Script, Sacramento, Alex Brush, Satisfy, Tangerine, Parisienne, Allura, Playfair Display, Cormorant Garamond, Lora, Cinzel, Libre Baskerville, Montserrat, Raleway, Poppins, Quicksand",
  "backgroundColor": "#hex",
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "textColor": "#hex",
  "enableGallery": true,
  "enableRsvp": true,
  "enableCountdown": true,
  "enableMessages": true
}

RULES: Return ONLY JSON. Only colors, font, and booleans. No customCss, no customHtml, no backgroundImage.`;

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

    // Select prompt based on mode + comprehensive toggle
    let systemPrompt: string;
    if (mode === "envelope") {
      systemPrompt = comprehensive ? COMPREHENSIVE_ENVELOPE_PROMPT : SIMPLE_ENVELOPE_PROMPT;
    } else {
      systemPrompt = comprehensive ? COMPREHENSIVE_INVITATION_PROMPT : SIMPLE_INVITATION_PROMPT;
    }

    // Build context
    let context = `\n\nCurrent config:\n${JSON.stringify(currentConfig, null, 2)}`;
    if (galleryPhotos?.length > 0) {
      context += `\n\nGallery photos (use PHOTO_N to reference):\n${galleryPhotos.map((p: string, i: number) => `PHOTO_${i} = ${p}`).join("\n")}`;
    }

    const fullPrompt = systemPrompt + context + "\n\nUser request: " + prompt;

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    });

    const text = response.text || "";

    let config: Record<string, unknown>;
    let galleryOrder: number[] | undefined;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      config = JSON.parse(jsonMatch[0]);

      if (Array.isArray(config.galleryOrder)) {
        galleryOrder = config.galleryOrder as number[];
        delete config.galleryOrder;
      }

      // Replace PHOTO_N references with actual URLs in customCss and customHtml
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

      // Remove undefined
      for (const key of Object.keys(config)) {
        if (config[key] === undefined) delete config[key];
      }
    } catch {
      return NextResponse.json({
        error: "AI returned invalid response. Try rephrasing your request.",
        rawResponse: text.slice(0, 500),
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
    if (config.customHtml && config.customHtml !== cur.customHtml) changes.push("Custom HTML elements added");
    if (galleryOrder) changes.push("Gallery reordered");

    const message = changes.length > 0
      ? `${comprehensive ? "Comprehensive" : "Style"} changes:\n${changes.map(c => `• ${c}`).join("\n")}\n\nClick "Apply" to preview.`
      : "Design ready. Click \"Apply\" to see changes.";

    return NextResponse.json({ config, galleryOrder, message });
  } catch (error) {
    console.error("Designer generate error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Design failed: ${msg}` }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ENVELOPE_PROMPT = `You are a wedding invitation ENVELOPE page designer. You design the envelope screen that guests see BEFORE opening the invitation.

## Envelope Page Elements
- **Background**: Dark radial gradient behind the envelope (envelopeBgColor)
- **Envelope Paper**: Cream/gold gradient paper (envelopePaperColor)
- **Text on Paper**: Couple names, greeting text (envelopeTextColor)
- **Decorative Gold Border**: Always gold (#c9a96e), not configurable
- **"LOVE" Stamp**: Gold colored stamp in top-right
- **"Open Invitation" Button**: Uses primaryColor
- **Wax Seal**: Uses primaryColor
- **Font**: primaryFont applies to all text
- **Greeting**: Shows "Dear Honourable Guest" or "Dear [Name]" for personalized links

## JSON to return (ALL fields required)
{
  "primaryFont": "Font name from: Great Vibes, Dancing Script, Sacramento, Alex Brush, Satisfy, Tangerine, Parisienne, Allura, Playfair Display, Cormorant Garamond, Lora, Cinzel, Libre Baskerville, EB Garamond, Montserrat, Raleway, Josefin Sans, Poppins, Quicksand",
  "primaryColor": "#hex - Open Invitation button and wax seal color",
  "accentColor": "#hex - decorative gold accent color",
  "envelopeBgColor": "#hex - dark background behind envelope",
  "envelopePaperColor": "#hex - light/warm envelope paper color",
  "envelopeTextColor": "#hex - dark text on the envelope paper"
}

## Presets
- Classic: Great Vibes, primary:#ed5566, accent:#c9a96e, envBg:#1a0a0a, envPaper:#fef5e7, envText:#3a2a1a
- Romantic: Dancing Script, primary:#e8a0b4, accent:#d4a574, envBg:#1a0812, envPaper:#fff0f5, envText:#4a2a3a
- Royal: Cinzel, primary:#c9a96e, accent:#d4af37, envBg:#0a0814, envPaper:#fdf8ef, envText:#2a1a0a
- Modern: Montserrat, primary:#2c3e50, accent:#bdc3c7, envBg:#f5f5f5, envPaper:#ffffff, envText:#2c3e50
- Vintage: Libre Baskerville, primary:#cd853f, accent:#d4a574, envBg:#1a100a, envPaper:#f5ebe0, envText:#3a2a1a

## RULES
1. Return ONLY valid JSON. No markdown, no backticks, no explanation
2. All colors must be #RRGGBB hex codes
3. envelopeBgColor should be DARK; envelopePaperColor should be LIGHT/warm
4. envelopeTextColor must contrast well with envelopePaperColor
5. Only change what the user asks; keep other values the same`;

const INVITATION_PROMPT = `You are a wedding INVITATION PAGE designer. You design the main invitation page that guests see AFTER opening the envelope.

## Invitation Page Sections (top to bottom)
1. **Hero**: Full-screen with couple names in primaryFont, title text, wedding date. Background uses backgroundColor
2. **Wedding Details**: Couple photos (circular), names in primaryFont, date/time display, venue name, address. Accent color (#c9a96e-style) used for decorative elements, dividers
3. **Countdown Timer**: Days/hours/minutes/seconds countdown to wedding. Uses text and accent colors
4. **Photo Gallery**: Grid of wedding photos with lightbox (toggleable via enableGallery)
5. **RSVP Form**: Name input, Accept/Decline radio, guest count, message textarea. Button uses primaryColor
6. **Footer**: Couple names in primaryFont
7. **Message Wall**: Fixed bottom-left ticker showing guest blessings. "Send Blessing" button

## JSON to return (ALL fields required)
{
  "primaryFont": "Font name from: Great Vibes, Dancing Script, Sacramento, Alex Brush, Satisfy, Tangerine, Parisienne, Allura, Playfair Display, Cormorant Garamond, Lora, Cinzel, Libre Baskerville, EB Garamond, Montserrat, Raleway, Josefin Sans, Poppins, Quicksand",
  "backgroundColor": "#hex - main page background",
  "primaryColor": "#hex - buttons (RSVP submit), interactive elements",
  "accentColor": "#hex - decorative dividers, ornaments, gold accents",
  "textColor": "#hex - body text color on main page",
  "backgroundImage": "URL or empty string",
  "enableGallery": true,
  "enableRsvp": true,
  "enableCountdown": true,
  "enableMessages": true,
  "customCss": "additional CSS rules or empty string"
}

## Presets
- Classic Elegant: Great Vibes, bg:#0d0505, primary:#ed5566, accent:#c9a96e, text:#ffffff
- Romantic Blush: Dancing Script, bg:#1a0a10, primary:#e8a0b4, accent:#d4a574, text:#fff5f5
- Garden Rustic: Sacramento, bg:#0f1a0d, primary:#8fbc8f, accent:#c9a96e, text:#f0ead6
- Modern Minimalist: Montserrat, bg:#ffffff, primary:#2c3e50, accent:#bdc3c7, text:#2c3e50
- Royal Gold: Cinzel, bg:#0a0a1a, primary:#c9a96e, accent:#d4af37, text:#f5f0e1
- Beach Tropical: Quicksand, bg:#0a1628, primary:#48c9b0, accent:#f0b27a, text:#ecf0f1

## Custom CSS Selectors
- section: Major content blocks
- h1, h2, h3: Headings
- .min-h-dvh: Hero section (full viewport)
- Use CSS for borders, gradients, shadows, animations

## Gallery Arrangement
If user asks to reorder gallery images, add "galleryOrder": [0-based indices] to JSON.

## RULES
1. Return ONLY valid JSON. No markdown, no backticks, no explanation
2. All colors must be #RRGGBB hex codes
3. textColor must have good contrast against backgroundColor
4. Only change what the user asks; keep other values the same
5. For theme changes: update ALL colors + font for cohesion`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { prompt, invitationId, currentConfig, galleryPhotos, mode } = body;

    if (!prompt || !invitationId) {
      return NextResponse.json({ error: "Missing prompt or invitationId" }, { status: 400 });
    }

    // Get Gemini API key from settings (stored in plain text)
    const apiKeySetting = await prisma.setting.findUnique({ where: { key: "geminiApiKey" } });
    const modelSetting = await prisma.setting.findUnique({ where: { key: "geminiModel" } });

    const apiKey = apiKeySetting?.value;
    const model = modelSetting?.value || "gemini-3.1-flash-lite-preview";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Go to Settings > Gemini AI Integration, enter your key, and click Save All Settings." },
        { status: 400 }
      );
    }

    // Select prompt based on mode
    const systemPrompt = mode === "envelope" ? ENVELOPE_PROMPT : INVITATION_PROMPT;

    // Build context
    let context = `\n\nCurrent config:\n${JSON.stringify(currentConfig, null, 2)}`;
    if (mode !== "envelope" && galleryPhotos?.length > 0) {
      context += `\n\nGallery has ${galleryPhotos.length} photos. Include "galleryOrder" if user asks to reorder.`;
    }

    const fullPrompt = systemPrompt + context + "\n\nUser request: " + prompt;

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    });

    const text = response.text || "";

    // Parse JSON
    let config: Record<string, unknown>;
    let galleryOrder: number[] | undefined;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      config = JSON.parse(jsonMatch[0]);

      // Extract galleryOrder
      if (Array.isArray(config.galleryOrder)) {
        galleryOrder = config.galleryOrder as number[];
        delete config.galleryOrder;
      }

      // Validate hex colors
      const colorFields = ["backgroundColor", "primaryColor", "accentColor", "textColor",
        "envelopeBgColor", "envelopePaperColor", "envelopeTextColor"];
      for (const f of colorFields) {
        if (config[f] && (typeof config[f] !== "string" || !/^#[0-9a-fA-F]{3,8}$/.test(config[f] as string))) {
          config[f] = (currentConfig as Record<string, unknown>)?.[f];
        }
      }

      // Validate font
      if (typeof config.primaryFont !== "string" || !config.primaryFont) {
        config.primaryFont = currentConfig?.primaryFont;
      }

      // Validate booleans
      for (const f of ["enableGallery", "enableRsvp", "enableCountdown", "enableMessages"]) {
        if (config[f] !== undefined && typeof config[f] !== "boolean") {
          config[f] = (currentConfig as Record<string, unknown>)?.[f] ?? true;
        }
      }

      // Validate strings
      if (config.backgroundImage !== undefined && typeof config.backgroundImage !== "string") {
        config.backgroundImage = currentConfig?.backgroundImage || "";
      }
      if (config.customCss !== undefined && typeof config.customCss !== "string") {
        config.customCss = currentConfig?.customCss || "";
      }

      // Remove undefined
      for (const key of Object.keys(config)) {
        if (config[key] === undefined) delete config[key];
      }
    } catch {
      return NextResponse.json({
        error: "AI returned an invalid response. Try rephrasing your request.",
        rawResponse: text.slice(0, 300),
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

    // Build change summary
    const cur = (currentConfig || {}) as Record<string, unknown>;
    const changes: string[] = [];
    const labels: Record<string, string> = {
      primaryFont: "Font", backgroundColor: "Background", primaryColor: "Primary",
      accentColor: "Accent", textColor: "Text", envelopeBgColor: "Envelope bg",
      envelopePaperColor: "Envelope paper", envelopeTextColor: "Envelope text",
      customCss: "Custom CSS",
    };
    for (const [k, label] of Object.entries(labels)) {
      if (config[k] && config[k] !== cur[k]) {
        changes.push(k === "customCss" ? "Custom CSS updated" : `${label} → ${config[k]}`);
      }
    }
    if (galleryOrder) changes.push("Gallery reordered");

    const message = changes.length > 0
      ? `Changes:\n${changes.map(c => `• ${c}`).join("\n")}\n\nClick "Apply Changes" to preview.`
      : "Design ready. Click \"Apply Changes\" to apply.";

    return NextResponse.json({ config, galleryOrder, message });
  } catch (error) {
    console.error("Designer generate error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Design generation failed: ${msg}` }, { status: 500 });
  }
}

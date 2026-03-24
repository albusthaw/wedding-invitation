import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DESIGN_SYSTEM_TEMPLATE = `You are an expert wedding invitation page designer AI. You generate design configurations as JSON for a wedding invitation website.

## Page Structure

The invitation has TWO main screens that you can customize:

### Screen 1: Envelope Page (shown first, before guest opens)
- Cream/gold envelope design with decorative border
- Personalized greeting ("Dear [Guest Name]" or "Dear Honourable Guest")
- Couple names displayed in the chosen font
- "LOVE" stamp decoration
- "Open Invitation" button (uses primaryColor)
- Wax seal at bottom (uses primaryColor)
- Background: dark radial gradient (controlled by envelopeBgColor)
- Envelope paper color (controlled by envelopePaperColor)
- Text on envelope uses envelopeTextColor

### Screen 2: Main Invitation Page (after opening envelope)
Sections in order:
1. **Hero** - Full-screen with couple names, title, wedding date, scroll indicator
2. **Wedding Details** - Couple photos (circular), names, date/time display with day/month/year columns, venue with Google Maps link
3. **Countdown Timer** - Days, hours, minutes, seconds boxes counting down
4. **Photo Gallery** - Grid of wedding photos (if enabled)
5. **RSVP Form** - Attendance form with name, accept/decline, guest count, message
6. **Footer** - Couple names
7. **Message Wall** - Floating bottom-left ticker of guest blessings + Send Blessing button

## Design Config JSON (return ALL fields)
{
  "primaryFont": "Font name",
  "backgroundColor": "#hex - main page background",
  "primaryColor": "#hex - buttons (RSVP, Open Invitation), wax seal, key interactive elements",
  "accentColor": "#hex - decorative elements: dividers, ornaments, date borders, gold accents",
  "textColor": "#hex - body text on main page",
  "backgroundImage": "URL or empty string - main page background image",
  "envelopeBgColor": "#hex - envelope screen background (dark, like #1a0a0a)",
  "envelopePaperColor": "#hex - envelope paper gradient start (like #fef5e7)",
  "envelopeTextColor": "#hex - text on envelope paper (like #3a2a1a)",
  "enableGallery": true,
  "enableRsvp": true,
  "enableCountdown": true,
  "enableMessages": true,
  "customCss": "CSS string or empty"
}

## Google Fonts (pre-loaded, pick one)
Script: Great Vibes, Dancing Script, Sacramento, Alex Brush, Satisfy, Tangerine, Parisienne, Allura
Serif: Playfair Display, Cormorant Garamond, Lora, Cinzel, Libre Baskerville, EB Garamond
Modern: Montserrat, Raleway, Josefin Sans, Poppins, Quicksand

## Theme Presets
- **Classic Elegant**: Great Vibes | bg:#0d0505 | primary:#ed5566 | accent:#c9a96e | text:#ffffff | envBg:#1a0a0a | envPaper:#fef5e7 | envText:#3a2a1a
- **Romantic Blush**: Dancing Script | bg:#1a0a10 | primary:#e8a0b4 | accent:#d4a574 | text:#fff5f5 | envBg:#1a0812 | envPaper:#fff0f5 | envText:#4a2a3a
- **Garden Rustic**: Sacramento | bg:#0f1a0d | primary:#8fbc8f | accent:#c9a96e | text:#f0ead6 | envBg:#0d140a | envPaper:#f5f0e0 | envText:#3a4a2a
- **Modern Minimalist**: Montserrat | bg:#ffffff | primary:#2c3e50 | accent:#bdc3c7 | text:#2c3e50 | envBg:#f5f5f5 | envPaper:#ffffff | envText:#2c3e50
- **Royal Gold**: Cinzel | bg:#0a0a1a | primary:#c9a96e | accent:#d4af37 | text:#f5f0e1 | envBg:#0a0814 | envPaper:#fdf8ef | envText:#2a1a0a
- **Beach Tropical**: Quicksand | bg:#0a1628 | primary:#48c9b0 | accent:#f0b27a | text:#ecf0f1 | envBg:#081420 | envPaper:#f0f8ff | envText:#1a3a4a
- **Vintage**: Libre Baskerville | bg:#2c1810 | primary:#cd853f | accent:#d4a574 | text:#f5f0e1 | envBg:#1a100a | envPaper:#f5ebe0 | envText:#3a2a1a
- **Moody Dark**: Cormorant Garamond | bg:#0a0a0a | primary:#8b0000 | accent:#b8860b | text:#d4d4d4 | envBg:#050505 | envPaper:#e8e0d8 | envText:#2a2020

## Custom CSS Selectors
- \`section\` - Main content sections
- \`h1, h2, h3\` - Headings at various levels
- \`.min-h-dvh\` - Full-height sections (hero)
- The envelope uses Tailwind classes - customCss applies to main page only

## Gallery Arrangement
If user asks to reorder gallery images, add "galleryOrder": [indices] to your JSON.

## CRITICAL RULES
1. Return ONLY valid JSON - NO markdown, NO backticks, NO explanation
2. ALL color values must be valid #RRGGBB hex codes
3. Maintain contrast: textColor must be readable on backgroundColor
4. Only change properties the user asked about; keep others the same
5. For theme changes: update ALL colors + font together for cohesion
6. envelopeBgColor should be dark; envelopePaperColor should be light/warm
7. The customCss should enhance, never break layout`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, invitationId, currentConfig, galleryPhotos } = await request.json();

    // Get Gemini API key from settings (stored in plain text)
    const apiKeySetting = await prisma.setting.findUnique({
      where: { key: "geminiApiKey" },
    });
    const modelSetting = await prisma.setting.findUnique({
      where: { key: "geminiModel" },
    });

    const apiKey = apiKeySetting?.value;
    const model = modelSetting?.value || "gemini-2.0-flash";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Go to Settings > Gemini AI Integration to add your API key, then click Save All Settings." },
        { status: 400 }
      );
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    // Build context about current state
    let contextInfo = `\n\nCurrent design configuration:\n${JSON.stringify(currentConfig, null, 2)}`;
    if (galleryPhotos && Array.isArray(galleryPhotos) && galleryPhotos.length > 0) {
      contextInfo += `\n\nGallery has ${galleryPhotos.length} photos. If user wants to reorder, include "galleryOrder" array.`;
    }

    const fullPrompt = DESIGN_SYSTEM_TEMPLATE + contextInfo + "\n\nUser request: " + prompt;

    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: "user", parts: [{ text: fullPrompt }] },
      ],
    });

    const text = response.text || "";

    // Try to parse JSON from response
    let config;
    let galleryOrder: number[] | undefined;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        config = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }

      // Extract galleryOrder if present
      if (config.galleryOrder && Array.isArray(config.galleryOrder)) {
        galleryOrder = config.galleryOrder;
        delete config.galleryOrder;
      }

      // Validate and normalize all fields
      const stringFields = ["primaryFont", "backgroundColor", "primaryColor", "accentColor", "textColor",
        "envelopeBgColor", "envelopePaperColor", "envelopeTextColor"];
      for (const field of stringFields) {
        if (typeof config[field] !== "string" || !config[field]) {
          config[field] = (currentConfig as Record<string, unknown>)?.[field] || undefined;
        }
      }
      // Remove undefined fields (don't override with empty)
      for (const field of stringFields) {
        if (config[field] === undefined) delete config[field];
      }
      // Validate hex colors
      const colorFields = ["backgroundColor", "primaryColor", "accentColor", "textColor",
        "envelopeBgColor", "envelopePaperColor", "envelopeTextColor"];
      for (const field of colorFields) {
        if (config[field] && !/^#[0-9a-fA-F]{3,8}$/.test(config[field])) {
          config[field] = (currentConfig as Record<string, unknown>)?.[field];
        }
      }
      // Ensure booleans
      for (const field of ["enableGallery", "enableRsvp", "enableCountdown", "enableMessages"]) {
        if (typeof config[field] !== "boolean") {
          config[field] = (currentConfig as Record<string, unknown>)?.[field] ?? true;
        }
      }
      if (typeof config.backgroundImage !== "string") config.backgroundImage = currentConfig?.backgroundImage || "";
      if (typeof config.customCss !== "string") config.customCss = currentConfig?.customCss || "";
    } catch {
      return NextResponse.json(
        {
          error: "AI returned an invalid response. Please try rephrasing your request.",
          rawResponse: text.slice(0, 500),
        },
        { status: 422 }
      );
    }

    // Mark invitation as needing republish if published
    const invitation = await prisma.invitationLetter.findUnique({
      where: { id: invitationId },
      select: { published: true },
    });

    if (invitation?.published) {
      await prisma.invitationLetter.update({
        where: { id: invitationId },
        data: { needsRepublish: true },
      });
    }

    // Build change summary
    const changes: string[] = [];
    const cur = (currentConfig || {}) as Record<string, unknown>;
    if (config.primaryFont && config.primaryFont !== cur.primaryFont) changes.push(`Font → ${config.primaryFont}`);
    if (config.backgroundColor && config.backgroundColor !== cur.backgroundColor) changes.push(`Background → ${config.backgroundColor}`);
    if (config.primaryColor && config.primaryColor !== cur.primaryColor) changes.push(`Primary → ${config.primaryColor}`);
    if (config.accentColor && config.accentColor !== cur.accentColor) changes.push(`Accent → ${config.accentColor}`);
    if (config.textColor && config.textColor !== cur.textColor) changes.push(`Text → ${config.textColor}`);
    if (config.envelopeBgColor && config.envelopeBgColor !== cur.envelopeBgColor) changes.push(`Envelope bg → ${config.envelopeBgColor}`);
    if (config.envelopePaperColor && config.envelopePaperColor !== cur.envelopePaperColor) changes.push(`Envelope paper → ${config.envelopePaperColor}`);
    if (config.envelopeTextColor && config.envelopeTextColor !== cur.envelopeTextColor) changes.push(`Envelope text → ${config.envelopeTextColor}`);
    if (config.customCss && config.customCss !== cur.customCss) changes.push("Custom CSS updated");
    if (galleryOrder) changes.push(`Gallery reordered`);

    const message = changes.length > 0
      ? `Design changes:\n${changes.map(c => `• ${c}`).join("\n")}\n\nClick "Apply Changes" to preview.`
      : "Design updated. Click \"Apply Changes\" to apply.";

    return NextResponse.json({ config, galleryOrder, message });
  } catch (error) {
    console.error("Designer generate error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate design: ${errMsg}. Check Settings > Gemini AI Integration.` },
      { status: 500 }
    );
  }
}

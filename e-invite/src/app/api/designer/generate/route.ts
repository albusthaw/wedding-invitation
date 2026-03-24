import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DESIGN_SYSTEM_TEMPLATE = `You are an expert wedding invitation page designer AI. You customize beautiful, elegant wedding invitation websites by modifying their design configuration.

## Available Design Properties

You control a wedding invitation page with these sections:
1. **Envelope Opener** - A beautiful animated envelope that opens to reveal the invitation
2. **Hero Section** - Full-screen title with couple names, date, and scroll indicator
3. **Wedding Details** - Couple photos, names, date/time display, venue with Google Maps link
4. **Countdown Timer** - Days/hours/minutes/seconds countdown to the wedding
5. **Photo Gallery** - A grid gallery of wedding photos with lightbox
6. **RSVP Form** - Guest attendance confirmation form
7. **Message Wall** - Floating ticker of guest blessings with send button
8. **Footer** - Couple names closing

## Design Config JSON Structure
Return ONLY a valid JSON object with ALL of these fields:
{
  "primaryFont": "Font name from list below",
  "backgroundColor": "#hex - page background",
  "primaryColor": "#hex - buttons, CTA, key accents (e.g. RSVP button)",
  "accentColor": "#hex - decorative elements, gold accents, dividers",
  "textColor": "#hex - main body text color",
  "backgroundImage": "URL or empty string",
  "enableGallery": true,
  "enableRsvp": true,
  "enableCountdown": true,
  "enableMessages": true,
  "customCss": "CSS rules or empty string"
}

## Available Google Fonts
Choose from these (already loaded):
- **Script/Cursive**: Great Vibes, Dancing Script, Sacramento, Alex Brush, Satisfy, Tangerine, Parisienne, Allura, Rouge Script
- **Serif/Elegant**: Playfair Display, Cormorant Garamond, Lora, Cinzel, Libre Baskerville, EB Garamond, Crimson Text
- **Modern**: Montserrat, Raleway, Josefin Sans, Poppins, Quicksand

## Theme Presets (use as starting points)
- **Classic Elegant**: Great Vibes, #0d0505 bg, #ed5566 primary, #c9a96e accent, #ffffff text
- **Romantic Blush**: Dancing Script, #1a0a10 bg, #e8a0b4 primary, #d4a574 accent, #fff5f5 text
- **Garden Rustic**: Sacramento, #0f1a0d bg, #8fbc8f primary, #c9a96e accent, #f0ead6 text
- **Modern Minimalist**: Montserrat, #ffffff bg, #2c3e50 primary, #bdc3c7 accent, #2c3e50 text
- **Royal Gold**: Cinzel, #0a0a1a bg, #c9a96e primary, #d4af37 accent, #f5f0e1 text
- **Beach/Tropical**: Quicksand, #0a1628 bg, #48c9b0 primary, #f0b27a accent, #ecf0f1 text
- **Vintage**: Libre Baskerville, #2c1810 bg, #cd853f primary, #d4a574 accent, #f5f0e1 text
- **Moody/Dark**: Cormorant Garamond, #0a0a0a bg, #8b0000 primary, #b8860b accent, #d4d4d4 text

## Custom CSS Capabilities
The customCss field can style any part of the invitation. Key selectors:
- \`section\` - Each major section block
- \`.text-[#c9a96e]\` - Accent colored text (Tailwind)
- \`h1, h2\` - Headings
- Custom class injections for advanced effects
- CSS animations, gradients, shadows, borders

## Gallery Image Arrangement
When the user asks to arrange, reorder, or modify gallery images, include a "galleryOrder" field in your response with an array of indices (0-based) representing the desired order. For example: "galleryOrder": [2, 0, 1, 3] means show the 3rd image first, then 1st, 2nd, 4th.

## Rules
1. Return ONLY the JSON object - no markdown, no backticks, no explanation text
2. All color values MUST be valid hex codes (#RGB or #RRGGBB)
3. Ensure WCAG-compliant contrast between textColor and backgroundColor (ratio >= 4.5:1)
4. Only change values relevant to the user's request; keep others the same
5. For theme changes, update colors + font + optionally customCss for a cohesive look
6. The customCss should enhance, not break the layout
7. Think about visual harmony - colors should complement each other`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, invitationId, currentConfig, galleryPhotos } = await request.json();

    // Get Gemini API key from settings
    const apiKeySetting = await prisma.setting.findUnique({
      where: { key: "geminiApiKey" },
    });
    const modelSetting = await prisma.setting.findUnique({
      where: { key: "geminiModel" },
    });

    const apiKey = apiKeySetting?.value;
    const model = modelSetting?.value || "gemini-3.1-flash-lite-preview";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Go to Settings to add it." },
        { status: 400 }
      );
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    // Build context about current state
    let contextInfo = `\nCurrent design configuration:\n${JSON.stringify(currentConfig, null, 2)}`;
    if (galleryPhotos && Array.isArray(galleryPhotos) && galleryPhotos.length > 0) {
      contextInfo += `\n\nCurrent gallery has ${galleryPhotos.length} photos: ${galleryPhotos.map((p: string, i: number) => `[${i}] ${p}`).join(", ")}`;
      contextInfo += `\nIf the user asks to arrange/reorder images, include "galleryOrder" array in your response.`;
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
      // Extract JSON from response (handle potential markdown wrapping)
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

      // Validate required fields exist and have correct types
      const requiredStringFields = ["primaryFont", "backgroundColor", "primaryColor", "accentColor", "textColor"];
      for (const field of requiredStringFields) {
        if (typeof config[field] !== "string" || !config[field]) {
          config[field] = (currentConfig as Record<string, unknown>)[field];
        }
      }
      // Ensure hex colors are valid
      for (const field of ["backgroundColor", "primaryColor", "accentColor", "textColor"]) {
        if (config[field] && !/^#[0-9a-fA-F]{3,8}$/.test(config[field])) {
          config[field] = (currentConfig as Record<string, unknown>)[field];
        }
      }
      // Ensure booleans
      for (const field of ["enableGallery", "enableRsvp", "enableCountdown", "enableMessages"]) {
        if (typeof config[field] !== "boolean") {
          config[field] = (currentConfig as Record<string, unknown>)[field] ?? true;
        }
      }
      // Ensure strings
      if (typeof config.backgroundImage !== "string") config.backgroundImage = "";
      if (typeof config.customCss !== "string") config.customCss = "";
    } catch {
      return NextResponse.json(
        {
          error: "AI returned invalid response. Please try again with a clearer prompt.",
          rawResponse: text,
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

    // Build a descriptive message about changes
    const changes: string[] = [];
    if (config.primaryFont !== currentConfig?.primaryFont) changes.push(`Font: ${config.primaryFont}`);
    if (config.backgroundColor !== currentConfig?.backgroundColor) changes.push(`Background: ${config.backgroundColor}`);
    if (config.primaryColor !== currentConfig?.primaryColor) changes.push(`Primary color: ${config.primaryColor}`);
    if (config.accentColor !== currentConfig?.accentColor) changes.push(`Accent: ${config.accentColor}`);
    if (config.textColor !== currentConfig?.textColor) changes.push(`Text: ${config.textColor}`);
    if (config.customCss && config.customCss !== currentConfig?.customCss) changes.push("Custom CSS updated");
    if (galleryOrder) changes.push(`Gallery reordered: ${galleryOrder.length} images`);

    const message = changes.length > 0
      ? `Here are the design changes I've made:\n${changes.map(c => `• ${c}`).join("\n")}\n\nClick "Apply Changes" to see them in the preview.`
      : "Design updated. Click \"Apply Changes\" to apply.";

    return NextResponse.json({
      config,
      galleryOrder,
      message,
    });
  } catch (error) {
    console.error("Designer generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate design. Check your Gemini API configuration." },
      { status: 500 }
    );
  }
}

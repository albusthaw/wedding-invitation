import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, invitationId, currentConfig } = await request.json();

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

    const systemPrompt = `You are a wedding invitation page designer AI. You customize wedding invitation websites by modifying design configuration.

Current design configuration:
${JSON.stringify(currentConfig, null, 2)}

Based on the user's request, return ONLY a valid JSON object with ALL these fields (keep unchanged values the same):
{
  "primaryFont": "Google Font name (Great Vibes, Playfair Display, Dancing Script, Sacramento, Cormorant Garamond, Lora, Cinzel, Tangerine, Alex Brush, Satisfy)",
  "backgroundColor": "#hex background color",
  "primaryColor": "#hex color for buttons and key accents",
  "accentColor": "#hex color for gold/decorative elements",
  "textColor": "#hex text color",
  "backgroundImage": "URL or empty string",
  "enableGallery": true,
  "enableRsvp": true,
  "enableCountdown": true,
  "enableMessages": true,
  "customCss": "additional CSS rules or empty string"
}

Important rules:
- Return ONLY the JSON object, no markdown, no backticks, no explanation
- All color values must be valid hex codes (e.g. #ff0000)
- Ensure good contrast between textColor and backgroundColor
- Only change values relevant to the user's request
- For theme requests, update colors, font, and optionally customCss together for a cohesive look`;

    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\nUser request: " + prompt }] },
      ],
    });

    const text = response.text || "";

    // Try to parse JSON from response
    let config;
    try {
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        config = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
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

    return NextResponse.json({
      config,
      message: "Design updated successfully",
    });
  } catch (error) {
    console.error("Designer generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate design. Check your Gemini API configuration." },
      { status: 500 }
    );
  }
}

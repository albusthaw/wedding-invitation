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

    const systemPrompt = `You are a wedding invitation page designer AI. You help customize wedding invitation websites.

The current design configuration is:
${JSON.stringify(currentConfig, null, 2)}

The user wants to make changes. Based on their request, return ONLY a valid JSON object with the updated design configuration. The JSON must have these fields:
- primaryFont: string (Google Font name, e.g., "Great Vibes", "Playfair Display", "Dancing Script", "Sacramento")
- backgroundColor: string (hex color)
- primaryColor: string (hex color for buttons/accents)
- accentColor: string (hex color for gold/decorative elements)
- textColor: string (hex color)
- backgroundImage: string (URL or empty string)
- enableGallery: boolean
- enableRsvp: boolean
- enableCountdown: boolean
- enableMessages: boolean
- customCss: string (additional CSS)

Only change values that are relevant to the user's request. Keep everything else the same.
Return ONLY the JSON object, no markdown, no explanation.`;

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

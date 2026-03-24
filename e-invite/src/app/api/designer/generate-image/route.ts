import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

// Image generation model (supports image output)
const IMAGE_MODEL = "gemini-2.0-flash-exp";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { prompt, invitationId, context } = body;

    if (!prompt || !invitationId) {
      return NextResponse.json({ error: "Missing prompt or invitationId" }, { status: 400 });
    }

    const apiKeySetting = await prisma.setting.findUnique({ where: { key: "geminiApiKey" } });
    const apiKey = apiKeySetting?.value;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Go to Settings to add it." },
        { status: 400 }
      );
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const fullPrompt = `You are a professional wedding invitation graphic designer. Create a high-quality decorative design element for a wedding invitation.

## Context
${context || "Wedding invitation design element"}

## Request
${prompt}

## Rules
- Create a beautiful, elegant design element suitable for a wedding invitation
- Use transparent or clean backgrounds when possible
- Make it high quality and visually appealing
- The image should be a design ELEMENT (decoration, border, flower, ornament, etc.), not a full page
- Keep it elegant and tasteful for a wedding context`;

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Extract image from response
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      return NextResponse.json(
        { error: "AI did not generate an image. Try a different prompt." },
        { status: 422 }
      );
    }

    let imageUrl: string | null = null;
    let textResponse = "";

    for (const part of candidate.content.parts) {
      if (part.text) {
        textResponse += part.text;
      } else if (part.inlineData) {
        // Save the image to disk
        const imageData = part.inlineData.data;
        if (!imageData) continue;

        const mimeType = part.inlineData.mimeType || "image/png";
        const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";

        const uploadDir = join(process.cwd(), "public", "uploads", "photos");
        await mkdir(uploadDir, { recursive: true });

        const fileName = `ai-${crypto.randomUUID()}.${ext}`;
        const filePath = join(uploadDir, fileName);

        const buffer = Buffer.from(imageData, "base64");
        await writeFile(filePath, buffer);

        imageUrl = `/uploads/photos/${fileName}`;
      }
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "AI could not generate an image for this request. Try rephrasing.", detail: textResponse.slice(0, 300) },
        { status: 422 }
      );
    }

    return NextResponse.json({
      url: imageUrl,
      description: textResponse || "Design element generated",
    });
  } catch (error) {
    console.error("Image generation error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Image generation failed: ${msg}` }, { status: 500 });
  }
}

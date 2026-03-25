import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const DEFAULT_IMAGE_MODEL = "gemini-3.1-flash-image-preview";

async function saveImageFromBase64(data: string, mimeType: string): Promise<string> {
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const uploadDir = join(process.cwd(), "public", "uploads", "photos");
  await mkdir(uploadDir, { recursive: true });
  const fileName = `ai-${crypto.randomUUID()}.${ext}`;
  const filePath = join(uploadDir, fileName);
  const buffer = Buffer.from(data, "base64");
  await writeFile(filePath, buffer);
  return `/uploads/photos/${fileName}`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { prompt, invitationId, context, generateMultiple } = body;

    if (!prompt || !invitationId) {
      return NextResponse.json({ error: "Missing prompt or invitationId" }, { status: 400 });
    }

    const apiKeySetting = await prisma.setting.findUnique({ where: { key: "geminiApiKey" } });
    const imageModelSetting = await prisma.setting.findUnique({ where: { key: "geminiImageModel" } });
    const apiKey = apiKeySetting?.value;
    const imageModel = imageModelSetting?.value || DEFAULT_IMAGE_MODEL;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Go to Settings to add it." },
        { status: 400 }
      );
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const generatedImages: { url: string; description: string }[] = [];

    if (generateMultiple) {
      // Multi-turn: AI plans elements, then we generate each one
      const planPrompt = `You are a wedding invitation design consultant. The user wants: "${prompt}"
Context: ${context || "Wedding invitation"}

List exactly the design element images needed. Return ONLY a JSON array of objects, each with "prompt" (detailed image generation prompt) and "description" (short label).
Example: [{"prompt":"Elegant red peony flower with gold leaves on transparent background, watercolor style","description":"Red peony decoration"},{"prompt":"Gold Chinese double happiness symbol, ornate calligraphy style","description":"Double happiness symbol"}]

Rules:
- Generate 3-6 elements that together create a cohesive theme
- Each prompt should describe ONE specific image element
- Include colors, style, and "transparent background" or "clean background"
- Be specific about the visual style (watercolor, vector, ornate, minimalist, etc.)
- Return ONLY the JSON array, no other text`;

      const planRes = await ai.models.generateContent({
        model: imageModelSetting?.value ? imageModel : "gemini-3.1-flash-lite-preview",
        contents: [{ role: "user", parts: [{ text: planPrompt }] }],
      });

      const planText = planRes.text || "";
      let elements: { prompt: string; description: string }[] = [];
      try {
        const match = planText.match(/\[[\s\S]*\]/);
        if (match) elements = JSON.parse(match[0]);
      } catch {
        elements = [{ prompt, description: "Design element" }];
      }

      // Cap at 6 elements
      elements = elements.slice(0, 6);

      // Generate each element image
      for (const el of elements) {
        try {
          const imgRes = await ai.models.generateContent({
            model: imageModel,
            contents: [{ role: "user", parts: [{ text: `Create a high-quality wedding design element: ${el.prompt}` }] }],
            config: { responseModalities: ["TEXT", "IMAGE"] },
          });

          const candidate = imgRes.candidates?.[0];
          if (!candidate?.content?.parts) continue;

          for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
              const url = await saveImageFromBase64(
                part.inlineData.data,
                part.inlineData.mimeType || "image/png"
              );
              generatedImages.push({ url, description: el.description });
              break; // one image per element
            }
          }
        } catch (err) {
          console.error(`Failed to generate element "${el.description}":`, err);
        }
      }
    } else {
      // Single image generation
      const fullPrompt = `Create a high-quality decorative design element for a wedding invitation.
Context: ${context || "Wedding invitation design element"}
Request: ${prompt}
Rules: elegant, tasteful for wedding, transparent or clean background, high quality.`;

      const response = await ai.models.generateContent({
        model: imageModel,
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        config: { responseModalities: ["TEXT", "IMAGE"] },
      });

      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts) {
        return NextResponse.json(
          { error: "AI did not generate an image. Try a different prompt." },
          { status: 422 }
        );
      }

      let textResponse = "";
      for (const part of candidate.content.parts) {
        if (part.text) textResponse += part.text;
        else if (part.inlineData?.data) {
          const url = await saveImageFromBase64(
            part.inlineData.data,
            part.inlineData.mimeType || "image/png"
          );
          generatedImages.push({ url, description: textResponse || "Design element" });
        }
      }
    }

    if (generatedImages.length === 0) {
      return NextResponse.json(
        { error: "AI could not generate images for this request. Try rephrasing." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      images: generatedImages,
      count: generatedImages.length,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Image generation failed: ${msg}` }, { status: 500 });
  }
}

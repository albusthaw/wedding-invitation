import { GoogleGenAI } from "@google/genai";

export function getGeminiClient(apiKey?: string): GoogleGenAI {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Gemini API key is not configured");
  }
  return new GoogleGenAI({ apiKey: key });
}

export async function generateDesign(
  client: GoogleGenAI,
  prompt: string,
  currentConfig: Record<string, unknown>,
  model: string = "gemini-2.0-flash"
): Promise<Record<string, unknown>> {
  const systemPrompt = `You are a wedding invitation design assistant. You help create beautiful wedding page designs by generating JSON configuration objects.

Current design configuration:
${JSON.stringify(currentConfig, null, 2)}

Based on the user's request, modify the design configuration. Return ONLY valid JSON with the updated design configuration. The configuration can include:
- colors: { primary, secondary, accent, background, text }
- fonts: { heading, body }
- layout: "classic" | "modern" | "elegant" | "rustic" | "minimalist"
- sections: { hero, story, gallery, rsvp, messages, countdown, location, music }
- animations: { type: "fade" | "slide" | "zoom" | "none", duration, delay }
- backgroundImage: string (URL or path)
- borderStyle: string
- spacing: "compact" | "normal" | "spacious"

Return only the JSON object, no markdown formatting or code blocks.`;

  const response = await client.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nUser request: ${prompt}` }],
      },
    ],
  });

  const text = response.text?.trim() || "{}";
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse AI response as valid JSON");
  }
}

export async function testConnection(
  apiKey: string,
  model: string
): Promise<{ success: boolean; message: string }> {
  try {
    const client = getGeminiClient(apiKey);
    const response = await client.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: "Reply with exactly: OK" }],
        },
      ],
    });

    if (response.text) {
      return { success: true, message: "Connection successful" };
    }
    return { success: false, message: "No response received from Gemini" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Connection failed: ${message}` };
  }
}

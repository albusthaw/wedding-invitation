import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { testConnection } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  let apiKey = body.apiKey as string;
  const model = (body.model as string) || "gemini-2.0-flash";

  if (!apiKey || apiKey === "***configured***") {
    const setting = await prisma.setting.findUnique({
      where: { key: "geminiApiKey" },
    });
    if (!setting?.value) {
      return NextResponse.json({
        success: false,
        message: "No API key configured",
      });
    }
    try {
      apiKey = decrypt(setting.value);
    } catch {
      return NextResponse.json({
        success: false,
        message: "Failed to decrypt stored API key",
      });
    }
  }

  const result = await testConnection(apiKey, model);
  return NextResponse.json(result);
}

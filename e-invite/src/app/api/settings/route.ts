import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/encryption";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.setting.findMany();
  const result: Record<string, string> = {};

  for (const setting of settings) {
    if (setting.key === "geminiApiKey") {
      result[setting.key] = setting.value ? "***configured***" : "";
    } else {
      result[setting.key] = setting.value;
    }
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    let storeValue = value as string;

    if (key === "geminiApiKey" && storeValue && storeValue !== "***configured***") {
      storeValue = encrypt(storeValue);
    } else if (key === "geminiApiKey" && storeValue === "***configured***") {
      continue;
    }

    await prisma.setting.upsert({
      where: { key },
      update: { value: storeValue },
      create: { key, value: storeValue },
    });
  }

  return NextResponse.json({ success: true });
}

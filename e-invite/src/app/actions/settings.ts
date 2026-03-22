"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { testConnection } from "@/lib/gemini";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  return session;
}

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { key },
  });
  return setting?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await requireAdmin();

  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return setting;
}

export async function getSettings(): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany();
  const result: Record<string, string> = {};
  for (const setting of settings) {
    result[setting.key] = setting.value;
  }
  return result;
}

export async function testGeminiConnection(
  apiKey: string,
  model: string
): Promise<{ success: boolean; message: string }> {
  await requireAdmin();

  if (!apiKey || !model) {
    return { success: false, message: "API key and model are required" };
  }

  return testConnection(apiKey, model);
}

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getGeminiClient, generateDesign } from "@/lib/gemini";
import { getSetting } from "@/app/actions/settings";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function generateDesignWithAI(
  prompt: string,
  invitationId: string
) {
  await requireAuth();

  if (!prompt || !invitationId) {
    throw new Error("Prompt and invitation ID are required");
  }

  const invitation = await prisma.invitationLetter.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  const apiKey = await getSetting("geminiApiKey");
  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured. Please set it in Settings."
    );
  }

  const model =
    (await getSetting("geminiModel")) || "gemini-2.0-flash";

  const currentConfig =
    (invitation.designConfig as Record<string, unknown>) || {};

  const client = getGeminiClient(apiKey);
  const newConfig = await generateDesign(client, prompt, currentConfig, model);

  await prisma.invitationLetter.update({
    where: { id: invitationId },
    data: {
      designConfig: newConfig as unknown as Record<string, string>,
      needsRepublish: true,
    },
  });

  revalidatePath(`/dashboard/invitations/${invitationId}`);
  revalidatePath(`/${invitation.slug}`);

  return newConfig;
}

export async function saveDesignConfig(
  invitationId: string,
  config: object
) {
  await requireAuth();

  const invitation = await prisma.invitationLetter.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  await prisma.invitationLetter.update({
    where: { id: invitationId },
    data: {
      designConfig: config as object,
      needsRepublish: true,
    },
  });

  revalidatePath(`/dashboard/invitations/${invitationId}`);
  revalidatePath(`/${invitation.slug}`);

  return config;
}

export async function getDesignConfig(invitationId: string) {
  await requireAuth();

  const invitation = await prisma.invitationLetter.findUnique({
    where: { id: invitationId },
    select: { designConfig: true },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  return (invitation.designConfig as Record<string, unknown>) || {};
}

export async function processImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> {
  await requireAuth();

  const uploadDir = join(process.cwd(), "public", "uploads", "photos");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = join(uploadDir, fileName);

  let imageBuffer: Uint8Array = buffer;

  // Auto-compress if image is too large (>2MB)
  const twoMB = 2 * 1024 * 1024;
  let outputQuality = quality;

  if (buffer.length > twoMB && outputQuality > 70) {
    outputQuality = 70;
  }

  const sharpInstance = sharp(imageBuffer).resize(maxWidth, maxHeight, {
    fit: "inside",
    withoutEnlargement: true,
  });

  if (ext === "png") {
    imageBuffer = await sharpInstance
      .png({ quality: outputQuality })
      .toBuffer();
  } else if (ext === "webp") {
    imageBuffer = await sharpInstance
      .webp({ quality: outputQuality })
      .toBuffer();
  } else {
    imageBuffer = await sharpInstance
      .jpeg({ quality: outputQuality })
      .toBuffer();
  }

  await writeFile(filePath, imageBuffer);

  return `/uploads/photos/${fileName}`;
}

export async function uploadMusic(
  invitationId: string,
  formData: FormData
) {
  await requireAuth();

  const invitation = await prisma.invitationLetter.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  const musicFile = formData.get("music") as File | null;
  if (!musicFile || musicFile.size === 0) {
    throw new Error("No music file provided");
  }

  const ext = musicFile.name.split(".").pop()?.toLowerCase();
  if (ext !== "mp3") {
    throw new Error("Only .mp3 files are supported");
  }

  const uploadDir = join(process.cwd(), "public", "uploads", "music");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${crypto.randomUUID()}.mp3`;
  const filePath = join(uploadDir, fileName);

  const buffer = Buffer.from(await musicFile.arrayBuffer());
  await writeFile(filePath, buffer);

  const musicPath = `/uploads/music/${fileName}`;

  await prisma.invitationLetter.update({
    where: { id: invitationId },
    data: {
      musicFile: musicPath,
      needsRepublish: true,
    },
  });

  revalidatePath(`/dashboard/invitations/${invitationId}`);
  revalidatePath(`/${invitation.slug}`);

  return musicPath;
}

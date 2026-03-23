"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  return session;
}

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    crypto.randomUUID().slice(0, 8)
  );
}

async function savePhoto(file: File): Promise<string> {
  const uploadDir = join(process.cwd(), "public", "uploads", "photos");
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = join(uploadDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return `/uploads/photos/${fileName}`;
}

export async function createInvitation(formData: FormData) {
  const session = await requireAuth();

  const title = formData.get("title") as string;
  const groomName = formData.get("groomName") as string;
  const brideName = formData.get("brideName") as string;
  const weddingDate = formData.get("weddingDate") as string;
  const weddingVenue = formData.get("weddingVenue") as string;
  const weddingAddress = formData.get("weddingAddress") as string;
  const mapPlusCode = (formData.get("mapPlusCode") as string) || null;

  if (!title || !groomName || !brideName || !weddingDate || !weddingVenue || !weddingAddress) {
    throw new Error("Missing required fields");
  }

  const slug = generateSlug(title);

  let groomPhoto: string | null = null;
  let bridePhoto: string | null = null;
  let couplePhoto: string | null = null;

  const groomPhotoFile = formData.get("groomPhoto") as File | null;
  if (groomPhotoFile && groomPhotoFile.size > 0) {
    groomPhoto = await savePhoto(groomPhotoFile);
  }

  const bridePhotoFile = formData.get("bridePhoto") as File | null;
  if (bridePhotoFile && bridePhotoFile.size > 0) {
    bridePhoto = await savePhoto(bridePhotoFile);
  }

  const couplePhotoFile = formData.get("couplePhoto") as File | null;
  if (couplePhotoFile && couplePhotoFile.size > 0) {
    couplePhoto = await savePhoto(couplePhotoFile);
  }

  const galleryFiles = formData.getAll("galleryPhotos") as File[];
  const galleryPhotos: string[] = [];
  for (const file of galleryFiles) {
    if (file && file.size > 0) {
      const path = await savePhoto(file);
      galleryPhotos.push(path);
    }
  }

  const invitation = await prisma.invitationLetter.create({
    data: {
      slug,
      title,
      groomName,
      brideName,
      weddingDate: new Date(weddingDate),
      weddingVenue,
      weddingAddress,
      mapPlusCode,
      groomPhoto,
      bridePhoto,
      couplePhoto,
      galleryPhotos: JSON.stringify(galleryPhotos),
      users: {
        create: {
          userId: session.user.id,
        },
      },
    },
  });

  revalidatePath("/dashboard/invitations");
  return invitation;
}

export async function updateInvitation(id: string, formData: FormData) {
  await requireAuth();

  const title = formData.get("title") as string;
  const groomName = formData.get("groomName") as string;
  const brideName = formData.get("brideName") as string;
  const weddingDate = formData.get("weddingDate") as string;
  const weddingVenue = formData.get("weddingVenue") as string;
  const weddingAddress = formData.get("weddingAddress") as string;

  const data: Record<string, unknown> = {
    needsRepublish: true,
  };

  if (title) data.title = title;
  if (groomName) data.groomName = groomName;
  if (brideName) data.brideName = brideName;
  if (weddingDate) data.weddingDate = new Date(weddingDate);
  if (weddingVenue) data.weddingVenue = weddingVenue;
  if (weddingAddress) data.weddingAddress = weddingAddress;

  const mapPlusCode = formData.get("mapPlusCode") as string | null;
  if (mapPlusCode !== null) data.mapPlusCode = mapPlusCode || null;

  const groomPhotoFile = formData.get("groomPhoto") as File | null;
  if (groomPhotoFile && groomPhotoFile.size > 0) {
    data.groomPhoto = await savePhoto(groomPhotoFile);
  }

  const bridePhotoFile = formData.get("bridePhoto") as File | null;
  if (bridePhotoFile && bridePhotoFile.size > 0) {
    data.bridePhoto = await savePhoto(bridePhotoFile);
  }

  const couplePhotoFile = formData.get("couplePhoto") as File | null;
  if (couplePhotoFile && couplePhotoFile.size > 0) {
    data.couplePhoto = await savePhoto(couplePhotoFile);
  }

  const galleryFiles = formData.getAll("galleryPhotos") as File[];
  if (galleryFiles.length > 0 && galleryFiles[0]?.size > 0) {
    const galleryPhotos: string[] = [];
    for (const file of galleryFiles) {
      if (file && file.size > 0) {
        const path = await savePhoto(file);
        galleryPhotos.push(path);
      }
    }
    data.galleryPhotos = JSON.stringify(galleryPhotos);
  }

  const customCss = formData.get("customCss") as string | null;
  if (customCss !== null) data.customCss = customCss;

  const customHtml = formData.get("customHtml") as string | null;
  if (customHtml !== null) data.customHtml = customHtml;

  const invitation = await prisma.invitationLetter.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard/invitations");
  revalidatePath(`/${invitation.slug}`);
  return invitation;
}

export async function deleteInvitation(id: string) {
  await requireAdmin();

  const invitation = await prisma.invitationLetter.findUnique({
    where: { id },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Clean up uploaded files
  const photoPaths = [
    invitation.groomPhoto,
    invitation.bridePhoto,
    invitation.couplePhoto,
  ].filter(Boolean) as string[];

  const gallery = invitation.galleryPhotos as string[] | null;
  if (Array.isArray(gallery)) {
    photoPaths.push(...gallery);
  }

  for (const photoPath of photoPaths) {
    try {
      const fullPath = join(process.cwd(), "public", photoPath);
      await unlink(fullPath);
    } catch {
      // File may not exist, continue
    }
  }

  await prisma.invitationLetter.delete({ where: { id } });

  revalidatePath("/dashboard/invitations");
}

export async function publishInvitation(id: string) {
  await requireAuth();

  const invitation = await prisma.invitationLetter.update({
    where: { id },
    data: {
      published: true,
      needsRepublish: false,
    },
  });

  revalidatePath("/dashboard/invitations");
  revalidatePath(`/${invitation.slug}`);
  return invitation;
}

export async function unpublishInvitation(id: string) {
  await requireAuth();

  const invitation = await prisma.invitationLetter.update({
    where: { id },
    data: {
      published: false,
    },
  });

  revalidatePath("/dashboard/invitations");
  revalidatePath(`/${invitation.slug}`);
  return invitation;
}

export async function getInvitations() {
  await requireAuth();

  return prisma.invitationLetter.findMany({
    include: {
      users: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      _count: {
        select: {
          invitees: true,
          messages: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvitation(id: string) {
  await requireAuth();

  const invitation = await prisma.invitationLetter.findUnique({
    where: { id },
    include: {
      users: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      invitees: {
        orderBy: { createdAt: "desc" },
      },
      messages: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  return invitation;
}

export async function assignUsersToInvitation(
  invitationId: string,
  userIds: string[]
) {
  await requireAdmin();

  // Remove existing assignments
  await prisma.userInvitation.deleteMany({
    where: { invitationId },
  });

  // Create new assignments
  await prisma.userInvitation.createMany({
    data: userIds.map((userId) => ({
      userId,
      invitationId,
    })),
  });

  revalidatePath("/dashboard/invitations");
  revalidatePath(`/dashboard/invitations/${invitationId}`);
}

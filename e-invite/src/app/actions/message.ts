"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function createMessage(formData: FormData) {
  // Public - no auth required
  const content = formData.get("content") as string;
  const senderName = formData.get("senderName") as string;
  const invitationId = formData.get("invitationId") as string;
  const userId = formData.get("userId") as string | null;

  if (!content || !senderName || !invitationId) {
    throw new Error("Missing required fields: content, senderName, and invitationId are required");
  }

  // Verify invitation exists
  const invitation = await prisma.invitationLetter.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  const message = await prisma.message.create({
    data: {
      content,
      senderName,
      invitationId,
      userId: userId || null,
    },
  });

  revalidatePath(`/${invitation.slug}`);
  revalidatePath(`/dashboard/invitations/${invitationId}`);
  return message;
}

export async function getMessages(invitationId?: string) {
  const where = invitationId ? { invitationId } : {};

  return prisma.message.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true },
      },
      invitation: {
        select: { id: true, title: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteMessage(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const message = await prisma.message.findUnique({
    where: { id },
    include: {
      invitation: { select: { slug: true } },
    },
  });

  if (!message) {
    throw new Error("Message not found");
  }

  await prisma.message.delete({ where: { id } });

  revalidatePath(`/${message.invitation.slug}`);
  revalidatePath(`/dashboard/invitations/${message.invitationId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import type { RsvpStatus } from "@prisma/client";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function addInvitee(formData: FormData) {
  const session = await requireAuth();

  const name = formData.get("name") as string;
  const invitationId = formData.get("invitationId") as string;

  if (!name || !invitationId) {
    throw new Error("Missing required fields: name and invitationId are required");
  }

  // Verify invitation exists
  const invitation = await prisma.invitationLetter.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Generate encrypted special code from invitee name + invitation id
  const plainText = `${name}::${invitationId}`;
  const specialCode = encrypt(plainText);

  const invitee = await prisma.invitee.create({
    data: {
      name,
      specialCode,
      invitationId,
      addedByUserId: session.user.id,
    },
  });

  revalidatePath(`/dashboard/invitations/${invitationId}`);
  return invitee;
}

export async function removeInvitee(id: string) {
  await requireAuth();

  const invitee = await prisma.invitee.findUnique({
    where: { id },
  });

  if (!invitee) {
    throw new Error("Invitee not found");
  }

  await prisma.invitee.delete({ where: { id } });

  revalidatePath(`/dashboard/invitations/${invitee.invitationId}`);
}

export async function getInvitees(invitationId: string) {
  await requireAuth();

  return prisma.invitee.findMany({
    where: { invitationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInviteeByCode(code: string) {
  // Public - no auth required
  try {
    const decrypted = decrypt(code);
    const [name, invitationId] = decrypted.split("::");

    if (!name || !invitationId) {
      return null;
    }

    const invitee = await prisma.invitee.findUnique({
      where: { specialCode: code },
      include: {
        invitation: {
          select: {
            id: true,
            slug: true,
            title: true,
            published: true,
          },
        },
      },
    });

    return invitee;
  } catch {
    return null;
  }
}

export async function updateRsvp(
  inviteeId: string,
  status: RsvpStatus,
  message?: string,
  guests?: number
) {
  // Public - no auth required (invitees RSVP from the public page)
  const invitee = await prisma.invitee.findUnique({
    where: { id: inviteeId },
  });

  if (!invitee) {
    throw new Error("Invitee not found");
  }

  const data: Record<string, unknown> = {
    rsvpStatus: status,
  };

  if (message !== undefined) {
    data.rsvpMessage = message;
  }

  if (guests !== undefined && guests >= 0) {
    data.numberOfGuests = guests;
  }

  const updated = await prisma.invitee.update({
    where: { id: inviteeId },
    data,
  });

  revalidatePath(`/dashboard/invitations/${invitee.invitationId}`);
  return updated;
}

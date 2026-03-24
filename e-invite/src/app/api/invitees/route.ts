import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const invitationId = searchParams.get("invitationId");

  if (!invitationId) {
    return NextResponse.json({ error: "invitationId required" }, { status: 400 });
  }

  const invitees = await prisma.invitee.findMany({
    where: { invitationId },
    include: {
      invitation: { select: { slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitees);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, invitationId } = body;

    if (!name || !invitationId) {
      return NextResponse.json(
        { error: "Name and invitationId are required" },
        { status: 400 }
      );
    }

    // Verify invitation exists
    const invitation = await prisma.invitationLetter.findUnique({
      where: { id: invitationId },
      select: { id: true, slug: true },
    });
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

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

    return NextResponse.json({ ...invitee, slug: invitation.slug });
  } catch (error) {
    console.error("Create invitee error:", error);
    return NextResponse.json({ error: "Failed to create invitee" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Invitee ID required" }, { status: 400 });
  }

  await prisma.invitee.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

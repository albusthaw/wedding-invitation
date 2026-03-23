import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invitation = await prisma.invitationLetter.findUnique({
    where: { id },
    include: {
      users: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { invitees: true, messages: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(invitation);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.groomName !== undefined) updateData.groomName = body.groomName;
    if (body.brideName !== undefined) updateData.brideName = body.brideName;
    if (body.weddingDate !== undefined) updateData.weddingDate = new Date(body.weddingDate);
    if (body.weddingVenue !== undefined) updateData.weddingVenue = body.weddingVenue;
    if (body.weddingAddress !== undefined) updateData.weddingAddress = body.weddingAddress;
    if (body.mapPlusCode !== undefined) updateData.mapPlusCode = body.mapPlusCode;
    if (body.designConfig !== undefined) updateData.designConfig = body.designConfig;
    if (body.galleryPhotos !== undefined) updateData.galleryPhotos = body.galleryPhotos;
    if (body.musicFile !== undefined) updateData.musicFile = body.musicFile;
    if (body.customCss !== undefined) updateData.customCss = body.customCss;
    if (body.customHtml !== undefined) updateData.customHtml = body.customHtml;
    if (body.needsRepublish !== undefined) updateData.needsRepublish = body.needsRepublish;

    const invitation = await prisma.invitationLetter.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Update invitation error:", error);
    return NextResponse.json(
      { error: "Failed to update invitation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.invitationLetter.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

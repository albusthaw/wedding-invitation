import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Public - no auth required (guests send blessings)
  try {
    const formData = await request.formData();
    const senderName = formData.get("senderName") as string;
    const content = formData.get("content") as string;
    const invitationId = formData.get("invitationId") as string;

    if (!senderName || !content || !invitationId) {
      return NextResponse.json(
        { error: "Missing required fields: senderName, content, and invitationId" },
        { status: 400 }
      );
    }

    // Verify invitation exists
    const invitation = await prisma.invitationLetter.findUnique({
      where: { id: invitationId },
    });
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check IP-based rate limiting for this invitation
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    const existingMessage = await prisma.message.findFirst({
      where: { invitationId, senderIp: ip },
    });
    if (existingMessage) {
      return NextResponse.json(
        { error: "You have already sent a blessing for this invitation." },
        { status: 429 }
      );
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderName,
        invitationId,
        senderIp: ip,
      },
    });

    return NextResponse.json({
      id: message.id,
      content: message.content,
      senderName: message.senderName,
      createdAt: message.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Message creation error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const invitationId = searchParams.get("invitationId");

  const where = invitationId ? { invitationId } : {};

  const messages = await prisma.message.findMany({
    where,
    include: {
      invitation: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(messages);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Message ID required" }, { status: 400 });
  }

  await prisma.message.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

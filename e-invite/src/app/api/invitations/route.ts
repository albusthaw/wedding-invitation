import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";

  if (isAdmin) {
    // Admin sees all invitations
    const invitations = await prisma.invitationLetter.findMany({
      include: {
        _count: { select: { invitees: true, messages: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invitations);
  }

  // Client sees only assigned invitations
  const assignments = await prisma.userInvitation.findMany({
    where: { userId: session.user.id },
    include: {
      invitation: {
        include: {
          _count: { select: { invitees: true, messages: true } },
        },
      },
    },
  });

  const invitations = assignments.map(a => a.invitation);
  return NextResponse.json(invitations);
}

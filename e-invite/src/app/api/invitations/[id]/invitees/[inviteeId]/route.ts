import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAccess(userId: string, role: string, invitationId: string) {
  if (role === "ADMIN") return true;
  const a = await prisma.userInvitation.findFirst({ where: { userId, invitationId } });
  return !!a;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteeId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, inviteeId } = await params;

  if (!(await checkAccess(session.user.id, session.user.role, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.invitee.delete({ where: { id: inviteeId } });
  return NextResponse.json({ success: true });
}

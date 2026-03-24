import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

async function checkAccess(userId: string, role: string, invitationId: string) {
  if (role === "ADMIN") return true;
  const a = await prisma.userInvitation.findFirst({ where: { userId, invitationId } });
  return !!a;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!(await checkAccess(session.user.id, session.user.role, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const specialCode = encrypt(`${name.trim()}::${id}`);

  const invitee = await prisma.invitee.create({
    data: {
      name: name.trim(),
      specialCode,
      invitationId: id,
      addedByUserId: session.user.id,
    },
  });

  return NextResponse.json(invitee, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Generate encrypted special code
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

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { names, invitationId } = body as { names: string[]; invitationId: string };

    if (!names || !Array.isArray(names) || names.length === 0 || !invitationId) {
      return NextResponse.json(
        { error: "names (array) and invitationId are required" },
        { status: 400 }
      );
    }

    // Verify invitation exists and user has access
    const invitation = await prisma.invitationLetter.findUnique({
      where: { id: invitationId },
      select: { id: true, slug: true },
    });
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN") {
      const assignment = await prisma.userInvitation.findFirst({
        where: { userId: session.user.id, invitationId },
      });
      if (!assignment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Filter out empty names and duplicates
    const uniqueNames = [...new Set(names.map(n => n.trim()).filter(Boolean))];

    const created = [];
    const errors: string[] = [];

    for (const name of uniqueNames) {
      try {
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
        created.push({ ...invitee, slug: invitation.slug });
      } catch {
        errors.push(`Failed to create invitee: ${name}`);
      }
    }

    return NextResponse.json({
      created: created.length,
      errors: errors.length,
      invitees: created,
      errorDetails: errors,
    });
  } catch (error) {
    console.error("Bulk invitee error:", error);
    return NextResponse.json({ error: "Failed to process bulk import" }, { status: 500 });
  }
}

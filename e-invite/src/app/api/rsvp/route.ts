import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const attendance = formData.get("attendance") as string;
    const guests = parseInt(formData.get("guests") as string) || 1;
    const message = formData.get("message") as string;
    const invitationId = formData.get("invitationId") as string;
    const inviteeId = formData.get("inviteeId") as string | null;

    if (!invitationId) {
      return NextResponse.json({ error: "Missing invitationId" }, { status: 400 });
    }

    // Update invitee RSVP if inviteeId provided
    if (inviteeId) {
      await prisma.invitee.update({
        where: { id: inviteeId },
        data: {
          rsvpStatus: attendance === "ACCEPTED" ? "ACCEPTED" : "DECLINED",
          rsvpMessage: message || null,
          numberOfGuests: guests,
        },
      });
    }

    // Create a message/blessing if message provided
    if (message) {
      await prisma.message.create({
        data: {
          content: message,
          senderName: name || "Guest",
          invitationId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json({ error: "Failed to submit RSVP" }, { status: 500 });
  }
}

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

    // Get client IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    // Check IP-based one-time submission per invitation letter
    const existingRsvp = await prisma.rsvpSubmission.findUnique({
      where: { ip_invitationId: { ip, invitationId } },
    });
    if (existingRsvp) {
      return NextResponse.json(
        { error: "You have already submitted your RSVP for this invitation." },
        { status: 429 }
      );
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
          senderIp: ip,
        },
      });
    }

    // Record the RSVP submission for IP tracking
    await prisma.rsvpSubmission.create({
      data: { ip, invitationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json({ error: "Failed to submit RSVP" }, { status: 500 });
  }
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import InvitationPage from "./InvitationPage";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ special?: string }>;
}

async function getInvitationBySlug(slug: string) {
  try {
    const invitation = await prisma.invitationLetter.findUnique({
      where: { slug },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
        },
        invitees: {
          select: {
            id: true,
            name: true,
            rsvpStatus: true,
            numberOfGuests: true,
          },
        },
      },
    });

    return invitation;
  } catch (error) {
    console.error("Failed to fetch invitation by slug:", error);
    return null;
  }
}

function lookupInvitee(code: string) {
  try {
    const decrypted = decrypt(code);
    const parts = decrypted.split("::");
    if (parts.length >= 2) {
      return { name: parts[0], invitationId: parts[1] };
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const invitation = await getInvitationBySlug(slug);

    if (!invitation || !invitation.published) {
      return { title: "Invitation Not Found" };
    }

    return {
      title: invitation.title,
      description: `Wedding invitation for ${invitation.groomName} & ${invitation.brideName}`,
      openGraph: {
        title: invitation.title,
        description: `You are invited to the wedding of ${invitation.groomName} & ${invitation.brideName}`,
        type: "website",
        ...(invitation.couplePhoto
          ? { images: [{ url: invitation.couplePhoto }] }
          : {}),
      },
    };
  } catch {
    return { title: "Invitation Not Found" };
  }
}

export default async function PublicInvitationPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { special } = await searchParams;

  const invitation = await getInvitationBySlug(slug);

  if (!invitation || !invitation.published) {
    notFound();
  }

  let inviteeName: string | null = null;
  let inviteeId: string | null = null;

  if (special) {
    const decoded = lookupInvitee(special);
    if (decoded && decoded.invitationId === invitation.id) {
      // Find the matching invitee record
      const invitee = await prisma.invitee.findFirst({
        where: {
          specialCode: special,
          invitationId: invitation.id,
        },
      });

      if (invitee) {
        inviteeName = invitee.name;
        inviteeId = invitee.id;
      }
    }
  }

  const serializedInvitation = {
    id: invitation.id,
    slug: invitation.slug,
    title: invitation.title,
    groomName: invitation.groomName,
    brideName: invitation.brideName,
    weddingDate: invitation.weddingDate.toISOString(),
    weddingVenue: invitation.weddingVenue,
    weddingAddress: invitation.weddingAddress,
    mapPlusCode: invitation.mapPlusCode,
    groomPhoto: invitation.groomPhoto,
    bridePhoto: invitation.bridePhoto,
    couplePhoto: invitation.couplePhoto,
    galleryPhotos: typeof invitation.galleryPhotos === "string"
      ? JSON.parse(invitation.galleryPhotos)
      : invitation.galleryPhotos,
    musicFile: invitation.musicFile,
    designConfig: invitation.designConfig,
    customCss: invitation.customCss,
    customHtml: invitation.customHtml,
    messages: invitation.messages.map((msg: { id: string; content: string; senderName: string; createdAt: Date }) => ({
      id: msg.id,
      content: msg.content,
      senderName: msg.senderName,
      createdAt: msg.createdAt.toISOString(),
    })),
  };

  return (
    <InvitationPage
      invitation={serializedInvitation}
      inviteeName={inviteeName}
      inviteeId={inviteeId}
    />
  );
}

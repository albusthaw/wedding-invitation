"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EnvelopeOpener from "@/components/invitation/EnvelopeOpener";
import MusicPlayer from "@/components/invitation/MusicPlayer";
import WeddingDetails from "@/components/invitation/WeddingDetails";
import PhotoGallery from "@/components/invitation/PhotoGallery";
import CountdownTimer from "@/components/invitation/CountdownTimer";
import RsvpForm from "@/components/invitation/RsvpForm";
import MessageWall from "@/components/invitation/MessageWall";

interface InvitationMessage {
  id: string;
  content: string;
  senderName: string;
  createdAt: string;
}

interface SerializedInvitation {
  id: string;
  slug: string;
  title: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  weddingVenue: string;
  weddingAddress: string;
  mapPlusCode: string | null;
  groomPhoto: string | null;
  bridePhoto: string | null;
  couplePhoto: string | null;
  galleryPhotos: unknown;
  musicFile: string | null;
  designConfig: unknown;
  customCss: string | null;
  customHtml: string | null;
  messages: InvitationMessage[];
}

interface InvitationPageProps {
  invitation: SerializedInvitation;
  inviteeName: string | null;
  inviteeId: string | null;
}

export default function InvitationPage({
  invitation,
  inviteeName,
  inviteeId,
}: InvitationPageProps) {
  const [isOpen, setIsOpen] = useState(false);

  const config = (invitation.designConfig || {}) as Record<string, unknown>;
  const primaryFont = (config.primaryFont as string) || "Great Vibes";
  const bgColor = (config.backgroundColor as string) || "#0d0505";
  const bgImage = (config.backgroundImage as string) || "";
  const galleryPhotos = Array.isArray(invitation.galleryPhotos)
    ? (invitation.galleryPhotos as string[])
    : [];

  return (
    <div
      className="min-h-dvh w-full overflow-x-hidden"
      style={{
        backgroundColor: bgColor,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Custom CSS injection */}
      {invitation.customCss && (
        <style dangerouslySetInnerHTML={{ __html: invitation.customCss }} />
      )}

      {/* Music Player - appears after envelope opens */}
      {invitation.musicFile && isOpen && (
        <MusicPlayer musicUrl={invitation.musicFile} />
      )}

      {/* Envelope Opener */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <EnvelopeOpener
            groomName={invitation.groomName}
            brideName={invitation.brideName}
            inviteeName={inviteeName || undefined}
            onOpen={() => setIsOpen(true)}
            fontFamily={primaryFont}
          />
        )}
      </AnimatePresence>

      {/* Main Invitation Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {/* Hero Section */}
            <section className="min-h-dvh flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/60" />
              <motion.div
                className="relative z-10 text-center px-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <motion.p
                  className="text-[#c9a96e] text-sm tracking-[0.4em] uppercase mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {invitation.title || "Wedding Invitation"}
                </motion.p>
                <motion.h1
                  className="text-5xl md:text-7xl text-white mb-3"
                  style={{ fontFamily: primaryFont }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  {invitation.groomName}
                </motion.h1>
                <motion.p
                  className="text-[#c9a96e] text-3xl my-2"
                  style={{ fontFamily: primaryFont }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  &amp;
                </motion.p>
                <motion.h1
                  className="text-5xl md:text-7xl text-white"
                  style={{ fontFamily: primaryFont }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                >
                  {invitation.brideName}
                </motion.h1>

                <motion.div
                  className="mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                >
                  <p className="text-white/60 text-sm">
                    {new Date(invitation.weddingDate).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                  className="mt-16"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mx-auto text-white/40"
                  >
                    <path
                      d="M12 5v14M19 12l-7 7-7-7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              </motion.div>
            </section>

            {/* Wedding Details */}
            <WeddingDetails
              groomName={invitation.groomName}
              brideName={invitation.brideName}
              weddingDate={invitation.weddingDate}
              weddingVenue={invitation.weddingVenue}
              weddingAddress={invitation.weddingAddress}
              mapPlusCode={invitation.mapPlusCode || undefined}
              couplePhoto={invitation.couplePhoto || undefined}
              groomPhoto={invitation.groomPhoto || undefined}
              bridePhoto={invitation.bridePhoto || undefined}
              fontFamily={primaryFont}
            />

            {/* Countdown Timer */}
            <CountdownTimer targetDate={invitation.weddingDate} />

            {/* Photo Gallery */}
            {galleryPhotos.length > 0 && (
              <PhotoGallery photos={galleryPhotos} fontFamily={primaryFont} />
            )}

            {/* RSVP Form */}
            <RsvpForm
              invitationId={invitation.id}
              inviteeId={inviteeId || undefined}
              inviteeName={inviteeName || undefined}
            />

            {/* Footer */}
            <section className="py-12 text-center">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <p
                  className="text-[#c9a96e] text-3xl mb-4"
                  style={{ fontFamily: primaryFont }}
                >
                  {invitation.groomName} &amp; {invitation.brideName}
                </p>
                <p className="text-white/20 text-xs tracking-widest">
                  {new Date(invitation.weddingDate).getFullYear()}
                </p>
              </motion.div>
            </section>

            {/* Custom HTML injection */}
            {invitation.customHtml && (
              <div
                dangerouslySetInnerHTML={{ __html: invitation.customHtml }}
              />
            )}

            {/* Floating Message Wall */}
            <MessageWall
              invitationId={invitation.id}
              initialMessages={invitation.messages}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

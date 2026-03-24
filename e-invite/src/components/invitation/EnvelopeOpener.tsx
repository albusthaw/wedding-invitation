"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface EnvelopeOpenerProps {
  groomName: string;
  brideName: string;
  inviteeName?: string;
  onOpen: () => void;
  fontFamily?: string;
  bgColor?: string;
  paperColor?: string;
  textColor?: string;
  primaryColor?: string;
}

export default function EnvelopeOpener({
  groomName,
  brideName,
  inviteeName,
  onOpen,
  fontFamily = "Great Vibes",
  bgColor,
  paperColor,
  textColor,
  primaryColor,
}: EnvelopeOpenerProps) {
  const [isOpening, setIsOpening] = useState(false);
  const envBg = bgColor || "#1a0a0a";
  const envBgDarker = bgColor ? bgColor.replace(/^#/, "") : "0d0505";
  const envPaper = paperColor || "#fef5e7";
  const envPaperEnd = paperColor || "#f5e6d0";
  const envText = textColor || "#3a2a1a";
  const envTextLight = textColor || "#5a4a3a";
  const envPrimary = primaryColor || "#ed5566";
  const envAccent = "#c9a96e"; // accent always gold on envelope

  const handleOpen = () => {
    setIsOpening(true);
    setTimeout(() => onOpen(), 1200);
  };

  return (
    <AnimatePresence>
      {!isOpening ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: `radial-gradient(ellipse at center, ${envBg} 0%, #${envBgDarker} 100%)`,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-[#c9a96e]/30"
                initial={{
                  x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
                  y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
                }}
                animate={{
                  y: [null, -20, 20],
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Envelope */}
          <motion.div
            className="relative w-[340px] max-w-[90vw] mx-auto"
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Envelope body */}
            <div className="relative rounded-lg shadow-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${envPaper}, ${envPaperEnd})` }}>
              {/* Gold border */}
              <div className="absolute inset-0 border-2 rounded-lg pointer-events-none" style={{ borderColor: `${envAccent}66` }} />

              {/* Stamp decoration */}
              <motion.div
                className="absolute top-4 right-4 w-14 h-14 border-2 rounded flex items-center justify-center"
                style={{ borderColor: `${envAccent}99` }}
                initial={{ rotate: -5 }}
                animate={{ rotate: 5 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <span className="text-xs font-semibold tracking-wider" style={{ color: envAccent }}>
                  LOVE
                </span>
              </motion.div>

              {/* Envelope flap (top triangle) */}
              <div
                className="absolute top-0 left-0 right-0 h-0 border-l-[170px] max-w-full border-r-[170px] border-t-[80px] border-l-transparent border-r-transparent border-t-[#e8d5b8]"
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
              />

              {/* Content */}
              <div className="pt-24 pb-10 px-8 text-center">
                {/* Decorative line */}
                <motion.div
                  className="w-16 h-[1px] mx-auto mb-6"
                  style={{ backgroundColor: envAccent }}
                  initial={{ width: 0 }}
                  animate={{ width: 64 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />

                {inviteeName ? (
                  <motion.p
                    className="text-sm tracking-widest uppercase mb-2" style={{ color: envTextLight }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    Dear
                  </motion.p>
                ) : (
                  <motion.p
                    className="text-sm tracking-widest uppercase mb-2" style={{ color: envTextLight }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    Dear Honourable Guest
                  </motion.p>
                )}

                {inviteeName && (
                  <motion.h2
                    className="text-2xl mb-4"
                    style={{ color: envText, fontFamily }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    {inviteeName}
                  </motion.h2>
                )}

                {/* Couple names */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <h1
                    className="text-4xl leading-tight mb-2"
                    style={{ color: envText, fontFamily }}
                  >
                    {groomName}
                  </h1>
                  <p
                    className="text-2xl my-1"
                    style={{ color: envAccent, fontFamily }}
                  >
                    &amp;
                  </p>
                  <h1
                    className="text-4xl leading-tight"
                    style={{ color: envText, fontFamily }}
                  >
                    {brideName}
                  </h1>
                </motion.div>

                <motion.p
                  className="text-xs tracking-widest uppercase mt-4"
                  style={{ color: envTextLight }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  request the honour of your presence
                </motion.p>

                {/* Decorative line */}
                <motion.div
                  className="w-16 h-[1px] mx-auto mt-6"
                  style={{ backgroundColor: envAccent }}
                  initial={{ width: 0 }}
                  animate={{ width: 64 }}
                  transition={{ delay: 1.1, duration: 0.8 }}
                />

                {/* Open button */}
                <motion.button
                  onClick={handleOpen}
                  className="mt-8 px-8 py-3 text-white rounded-full text-sm tracking-widest uppercase cursor-pointer transition-colors shadow-lg"
                  style={{ backgroundColor: envPrimary }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Open Invitation
                </motion.button>
              </div>

              {/* Bottom wax seal decoration */}
              <motion.div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: envPrimary }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.5, type: "spring" }}
              >
                <span className="text-white text-lg" style={{ fontFamily }}>
                  ♥
                </span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <motion.div
            className="relative w-[340px] max-w-[90vw]"
            animate={{
              scale: 1.5,
              opacity: 0,
              rotateX: 30,
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <div className="rounded-lg p-12 text-center" style={{ background: `linear-gradient(135deg, ${envPaper}, ${envPaperEnd})` }}>
              <h1
                className="text-3xl"
                style={{ color: envText, fontFamily }}
              >
                {groomName} & {brideName}
              </h1>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

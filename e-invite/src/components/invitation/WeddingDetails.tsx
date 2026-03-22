"use client";

import { motion } from "framer-motion";

interface WeddingDetailsProps {
  groomName: string;
  brideName: string;
  weddingDate: string;
  weddingVenue: string;
  weddingAddress: string;
  couplePhoto?: string;
  groomPhoto?: string;
  bridePhoto?: string;
  fontFamily?: string;
}

export default function WeddingDetails({
  groomName,
  brideName,
  weddingDate,
  weddingVenue,
  weddingAddress,
  couplePhoto,
  groomPhoto,
  bridePhoto,
  fontFamily = "Great Vibes",
}: WeddingDetailsProps) {
  const date = new Date(weddingDate);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <section className="relative py-16 px-4 text-center text-white overflow-hidden">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Decorative top element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="text-[#c9a96e] text-5xl mb-2">❦</div>
        </motion.div>

        {/* Couple Photos */}
        {(groomPhoto || bridePhoto) && (
          <motion.div
            className="flex items-center justify-center gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {groomPhoto && (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-3 border-[#c9a96e] shadow-lg">
                <img
                  src={groomPhoto}
                  alt={groomName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="text-[#c9a96e] text-3xl" style={{ fontFamily }}>
              &amp;
            </div>
            {bridePhoto && (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-3 border-[#c9a96e] shadow-lg">
                <img
                  src={bridePhoto}
                  alt={brideName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Couple Photo (single) */}
        {couplePhoto && !groomPhoto && !bridePhoto && (
          <motion.div
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-3 border-[#c9a96e] shadow-xl">
              <img
                src={couplePhoto}
                alt={`${groomName} & ${brideName}`}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        )}

        {/* Names */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <p className="text-xs tracking-[0.3em] uppercase text-white/60 mb-4">
            Together with their families
          </p>
          <h2
            className="text-5xl md:text-6xl text-white mb-2"
            style={{ fontFamily }}
          >
            {groomName}
          </h2>
          <p
            className="text-3xl text-[#c9a96e] my-2"
            style={{ fontFamily }}
          >
            &amp;
          </p>
          <h2
            className="text-5xl md:text-6xl text-white mb-6"
            style={{ fontFamily }}
          >
            {brideName}
          </h2>
        </motion.div>

        <motion.div
          className="w-20 h-[1px] bg-[#c9a96e] mx-auto my-8"
          initial={{ width: 0 }}
          whileInView={{ width: 80 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />

        {/* Date & Venue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <p
            className="text-xs tracking-[0.3em] uppercase text-white/60 mb-3"
          >
            Save the Date
          </p>

          {/* Date display */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <p className="text-3xl font-light" style={{ fontFamily: "Playfair Display" }}>
                {date.getDate()}
              </p>
            </div>
            <div className="w-[1px] h-12 bg-[#c9a96e]" />
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest">
                {date.toLocaleDateString("en-US", { month: "long" })}
              </p>
              <p className="text-sm text-white/60">{date.getFullYear()}</p>
            </div>
            <div className="w-[1px] h-12 bg-[#c9a96e]" />
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest">
                {date.toLocaleDateString("en-US", { weekday: "long" })}
              </p>
              <p className="text-sm text-white/60">{formattedTime}</p>
            </div>
          </div>

          {/* Venue */}
          <div className="mt-8">
            <p className="text-xs tracking-[0.3em] uppercase text-white/60 mb-3">
              Venue
            </p>
            <h3
              className="text-2xl md:text-3xl text-white mb-2"
              style={{ fontFamily: "Playfair Display" }}
            >
              {weddingVenue}
            </h3>
            <p className="text-white/70 text-sm leading-relaxed max-w-md mx-auto">
              {weddingAddress}
            </p>
          </div>
        </motion.div>

        {/* Decorative bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <div className="text-[#c9a96e] text-3xl">❦</div>
        </motion.div>
      </div>
    </section>
  );
}

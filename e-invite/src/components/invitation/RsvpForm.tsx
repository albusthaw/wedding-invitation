"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface RsvpFormProps {
  invitationId: string;
  inviteeId?: string;
  inviteeName?: string;
}

export default function RsvpForm({
  invitationId,
  inviteeId,
  inviteeName,
}: RsvpFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    const form = new FormData(e.currentTarget);
    form.append("invitationId", invitationId);
    if (inviteeId) form.append("inviteeId", inviteeId);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        setStatus("success");
        setMessage("Thank you for your response!");
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        if (res.status === 429) {
          setMessage(data.error || "You have already submitted your RSVP.");
        } else {
          setMessage(data.error || "Something went wrong. Please try again.");
        }
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="py-16 px-4">
      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center mb-8">
          <h2
            className="text-3xl md:text-4xl text-[#c9a96e] mb-3"
            style={{ fontFamily: "Great Vibes" }}
          >
            RSVP
          </h2>
          <p className="text-white/60 text-sm">
            Kindly respond by letting us know if you&apos;ll be attending
          </p>
          <div className="w-16 h-[1px] bg-[#c9a96e] mx-auto mt-3" />
        </div>

        {status === "success" ? (
          <motion.div
            className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-xl border border-[#c9a96e]/30"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-4xl mb-4">💌</div>
            <p className="text-white text-lg" style={{ fontFamily: "Playfair Display" }}>
              {message}
            </p>
          </motion.div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-[#c9a96e]/30 space-y-4"
          >
            {!inviteeName && (
              <div>
                <label className="block text-white/70 text-xs tracking-widest uppercase mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#c9a96e] transition-colors text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-white/70 text-xs tracking-widest uppercase mb-2">
                Attendance
              </label>
              <div className="flex gap-3">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="attendance"
                    value="ACCEPTED"
                    defaultChecked
                    className="peer hidden"
                  />
                  <div className="p-3 text-center border border-white/20 rounded-lg text-white/70 text-sm peer-checked:border-[#c9a96e] peer-checked:text-[#c9a96e] peer-checked:bg-[#c9a96e]/10 transition-all">
                    Joyfully Accept
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="attendance"
                    value="DECLINED"
                    className="peer hidden"
                  />
                  <div className="p-3 text-center border border-white/20 rounded-lg text-white/70 text-sm peer-checked:border-[#ed5566] peer-checked:text-[#ed5566] peer-checked:bg-[#ed5566]/10 transition-all">
                    Regretfully Decline
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-xs tracking-widest uppercase mb-2">
                Number of Guests
              </label>
              <select
                name="guests"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#c9a96e] transition-colors text-sm"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n} className="bg-[#1a1a2e] text-white">
                    {n} {n === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white/70 text-xs tracking-widest uppercase mb-2">
                Message for the Couple
              </label>
              <textarea
                name="message"
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#c9a96e] transition-colors text-sm resize-none"
                placeholder="Write your wishes..."
              />
            </div>

            <motion.button
              type="submit"
              disabled={status === "submitting"}
              className="w-full py-3 bg-[#ed5566] text-white rounded-full text-sm tracking-widest uppercase hover:bg-[#d94455] transition-colors disabled:opacity-50 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {status === "submitting" ? "Sending..." : "Send RSVP"}
            </motion.button>

            {status === "error" && (
              <p className="text-[#ed5566] text-sm text-center">{message}</p>
            )}
          </form>
        )}
      </motion.div>
    </section>
  );
}

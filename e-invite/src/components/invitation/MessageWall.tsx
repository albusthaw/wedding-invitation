"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

interface MessageItem {
  id: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface MessageWallProps {
  invitationId: string;
  initialMessages: MessageItem[];
}

export default function MessageWall({
  invitationId,
  initialMessages,
}: MessageWallProps) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [showInput, setShowInput] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ticker for comments
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop += 1;
        if (
          scrollRef.current.scrollTop >=
          scrollRef.current.scrollHeight - scrollRef.current.clientHeight
        ) {
          scrollRef.current.scrollTop = 0;
        }
      }
    }, 50);
    return () => clearInterval(interval);
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    const form = new FormData(e.currentTarget);
    form.append("invitationId", invitationId);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        setShowInput(false);
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      // silently fail
    }
    setSending(false);
  };

  return (
    <>
      {/* Floating message ticker (bottom-left) */}
      {messages.length > 0 && (
        <div className="fixed bottom-20 left-3 z-[101] max-w-[200px]">
          <div
            ref={scrollRef}
            className="bg-black/35 rounded-xl px-3 py-2 max-h-[100px] overflow-hidden"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="text-white text-xs py-1 truncate"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <span className="text-[#c9a96e] font-medium">
                  {msg.senderName}:
                </span>{" "}
                {msg.content}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blessing button */}
      <motion.button
        className="fixed bottom-6 left-3 z-[101] px-4 py-2 bg-black/35 rounded-full text-white text-xs tracking-wider cursor-pointer border border-white/10"
        onClick={() => setShowInput(true)}
        whileTap={{ scale: 0.95 }}
      >
        💌 Send Blessing
      </motion.button>

      {/* Input modal */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/44"
              onClick={() => setShowInput(false)}
            />
            <motion.div
              className="relative w-full max-w-md bg-gradient-to-b from-[#fef5e7] to-[#f5e6d0] rounded-t-xl p-6"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="w-10 h-1 bg-[#c9a96e]/40 rounded-full mx-auto mb-4" />
              <h3
                className="text-[#3a2a1a] text-xl text-center mb-4"
                style={{ fontFamily: "Great Vibes" }}
              >
                Send Your Blessing
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  name="senderName"
                  required
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-white/60 border border-[#c9a96e]/30 rounded-lg text-[#3a2a1a] placeholder-[#3a2a1a]/40 focus:outline-none focus:border-[#c9a96e] text-sm"
                />
                <textarea
                  name="content"
                  required
                  rows={3}
                  placeholder="Write your blessing..."
                  className="w-full px-4 py-3 bg-white/60 border border-[#c9a96e]/30 rounded-lg text-[#3a2a1a] placeholder-[#3a2a1a]/40 focus:outline-none focus:border-[#c9a96e] text-sm resize-none"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 bg-[#ed5566] text-white rounded-full text-sm tracking-widest uppercase cursor-pointer disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send Blessing"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PreviewPopupProps {
  slug: string;
  onClose: () => void;
}

type DeviceType = "phone" | "tablet" | "desktop";

const DEVICE_SIZES: Record<DeviceType, { width: number; height: number; label: string }> = {
  phone: { width: 375, height: 812, label: "Phone" },
  tablet: { width: 768, height: 1024, label: "Tablet" },
  desktop: { width: 1280, height: 800, label: "Desktop" },
};

export default function PreviewPopup({ slug, onClose }: PreviewPopupProps) {
  const [device, setDevice] = useState<DeviceType>("phone");
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentDevice = DEVICE_SIZES[device];

  // Calculate scale to fit within the viewport
  useEffect(() => {
    function calcScale() {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const availableWidth = containerRect.width - 64; // padding
      const availableHeight = containerRect.height - 64;

      const scaleX = availableWidth / currentDevice.width;
      const scaleY = availableHeight / currentDevice.height;
      const newScale = Math.min(scaleX, scaleY, 1);
      setScale(Math.max(newScale, 0.2));
    }

    calcScale();
    window.addEventListener("resize", calcScale);
    return () => window.removeEventListener("resize", calcScale);
  }, [currentDevice]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center w-full h-full max-w-[95vw] max-h-[95vh] p-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Top controls bar */}
          <div className="flex items-center justify-between w-full max-w-3xl mb-4 shrink-0">
            {/* Device toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1a1a2e] border border-[#2a2a4a]">
              {(Object.keys(DEVICE_SIZES) as DeviceType[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    device === d
                      ? "bg-[#ed5566] text-white shadow-md"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {d === "phone" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  {d === "tablet" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  {d === "desktop" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  {DEVICE_SIZES[d].label}
                </button>
              ))}
            </div>

            {/* Dimensions display */}
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-white/40 text-xs font-mono">
                {currentDevice.width} x {currentDevice.height} ({Math.round(scale * 100)}%)
              </span>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] text-white/60 hover:text-white hover:bg-[#2a2a4a] transition-all"
              title="Close preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Phone frame container */}
          <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center w-full overflow-hidden"
          >
            <div
              className="relative transition-all duration-300"
              style={{
                width: currentDevice.width * scale,
                height: currentDevice.height * scale,
              }}
            >
              {/* Device frame */}
              <div
                className={`absolute inset-0 rounded-[${device === "phone" ? "40px" : device === "tablet" ? "24px" : "12px"}] border-[3px] border-[#333] bg-black shadow-2xl overflow-hidden`}
                style={{
                  borderRadius:
                    device === "phone"
                      ? 40 * scale
                      : device === "tablet"
                      ? 24 * scale
                      : 12 * scale,
                }}
              >
                {/* Notch (phone only) */}
                {device === "phone" && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 bg-black z-10 rounded-b-2xl"
                    style={{
                      width: 150 * scale,
                      height: 30 * scale,
                    }}
                  />
                )}

                {/* iframe */}
                <iframe
                  src={`/${slug}?preview=true`}
                  className="w-full h-full border-0 bg-white"
                  style={{
                    width: currentDevice.width,
                    height: currentDevice.height,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                  title="Invitation Preview"
                />
              </div>

              {/* Home indicator (phone only) */}
              {device === "phone" && (
                <div
                  className="absolute bottom-[8px] left-1/2 -translate-x-1/2 rounded-full bg-white/30"
                  style={{
                    width: 100 * scale,
                    height: 4 * scale,
                  }}
                />
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

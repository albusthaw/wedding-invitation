"use client";

import { useState, useEffect, useRef } from "react";

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
}

const FONTS = [
  { name: "Great Vibes", family: "'Great Vibes', cursive", style: "Elegant Script" },
  { name: "Playfair Display", family: "'Playfair Display', serif", style: "Classic Serif" },
  { name: "Dancing Script", family: "'Dancing Script', cursive", style: "Casual Script" },
  { name: "Sacramento", family: "'Sacramento', cursive", style: "Flowing Script" },
  { name: "Tangerine", family: "'Tangerine', cursive", style: "Delicate Script" },
  { name: "Alex Brush", family: "'Alex Brush', cursive", style: "Brush Script" },
  { name: "Montserrat", family: "'Montserrat', sans-serif", style: "Modern Sans" },
  { name: "Lora", family: "'Lora', serif", style: "Contemporary Serif" },
  { name: "Cormorant Garant", family: "'Cormorant Garant', serif", style: "Refined Serif" },
  { name: "Poppins", family: "'Poppins', sans-serif", style: "Clean Sans" },
];

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=" +
  FONTS.map((f) => f.name.replace(/ /g, "+")).join("&family=") +
  "&display=swap";

export default function FontSelector({ value, onChange }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load Google Fonts dynamically
  useEffect(() => {
    const existingLink = document.querySelector(
      `link[href="${GOOGLE_FONTS_URL}"]`
    );
    if (existingLink) {
      setFontsLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    link.onload = () => setFontsLoaded(true);
    document.head.appendChild(link);

    return () => {
      // Don't remove - other components may need these fonts
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const selectedFont = FONTS.find((f) => f.name === value) || FONTS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-white/60 mb-1.5">
        Primary Font
      </label>

      {/* Selected font display / trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all text-left"
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className="text-sm truncate"
            style={{
              fontFamily: fontsLoaded ? selectedFont.family : "inherit",
            }}
          >
            {selectedFont.name}
          </span>
          <span className="text-[10px] text-white/40">{selectedFont.style}</span>
        </div>
        <svg
          className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] shadow-xl">
          {FONTS.map((font) => (
            <button
              key={font.name}
              type="button"
              onClick={() => {
                onChange(font.name);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all hover:bg-white/10 ${
                value === font.name
                  ? "bg-[#ed5566]/10 text-white"
                  : "text-white/80"
              }`}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span
                  className="text-sm truncate"
                  style={{
                    fontFamily: fontsLoaded ? font.family : "inherit",
                  }}
                >
                  {font.name}
                </span>
                <span className="text-[10px] text-white/40">{font.style}</span>
              </div>
              {value === font.name && (
                <svg className="w-4 h-4 text-[#ed5566] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Font preview */}
      {fontsLoaded && (
        <div
          className="mt-2 p-3 rounded-lg bg-white/5 border border-white/5 text-center"
          style={{ fontFamily: selectedFont.family }}
        >
          <p className="text-lg text-white/80">Sarah & James</p>
          <p className="text-xs text-white/40 mt-1 font-sans">Preview</p>
        </div>
      )}
    </div>
  );
}

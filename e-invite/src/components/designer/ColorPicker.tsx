"use client";

import { useState, useRef } from "react";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  { name: "Rose", value: "#ed5566" },
  { name: "Gold", value: "#d4a843" },
  { name: "Navy", value: "#1e3a5f" },
  { name: "Burgundy", value: "#722f37" },
  { name: "Sage", value: "#9caf88" },
  { name: "Blush", value: "#f4c2c2" },
  { name: "Ivory", value: "#fffff0" },
  { name: "Charcoal", value: "#36454f" },
];

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleSwatchClick() {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }

  function handlePresetClick(color: string) {
    onChange(color);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-medium text-white/60 mb-1.5">
        {label}
      </label>

      <div className="flex items-center gap-2">
        {/* Color swatch + native picker */}
        <button
          type="button"
          onClick={handleSwatchClick}
          className="w-9 h-9 rounded-lg border-2 border-white/20 cursor-pointer transition-all hover:border-white/40 hover:scale-105 shrink-0"
          style={{ backgroundColor: value }}
          title="Click to pick color"
        />
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />

        {/* Hex value input */}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
              onChange(v);
            }
          }}
          onBlur={() => {
            if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
              onChange("#000000");
            }
          }}
          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all"
          maxLength={7}
        />

        {/* Presets toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
          title="Preset colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
        </button>
      </div>

      {/* Preset colors dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 p-2 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] shadow-xl">
          <div className="grid grid-cols-4 gap-1.5">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePresetClick(preset.value)}
                className={`group flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all hover:bg-white/10 ${
                  value === preset.value ? "bg-white/10 ring-1 ring-[#ed5566]/50" : ""
                }`}
                title={preset.name}
              >
                <div
                  className="w-6 h-6 rounded-full border border-white/20 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: preset.value }}
                />
                <span className="text-[10px] text-white/50 group-hover:text-white/80 transition-colors">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

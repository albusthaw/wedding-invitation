"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Safe ID generator that works in all browser contexts (including non-HTTPS)
let _idCounter = 0;
function genId(): string {
  _idCounter++;
  return `msg-${Date.now()}-${_idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

interface DesignConfig {
  primaryFont: string; backgroundColor: string; primaryColor: string;
  accentColor: string; textColor: string; backgroundImage: string;
  envelopeBgColor?: string; envelopePaperColor?: string; envelopeTextColor?: string;
  enableGallery: boolean; enableRsvp: boolean; enableCountdown: boolean; enableMessages: boolean;
  sectionOrder?: string[]; customCss: string; customHtml?: string;
}

interface ChatMsg {
  id: string; role: "user" | "assistant" | "system";
  content: string; config?: Partial<DesignConfig>; galleryOrder?: number[];
  images?: { url: string; description: string }[];
}

interface AIChatPanelProps {
  mode: "envelope" | "invitation"; currentConfig: DesignConfig;
  onApplyConfig: (config: DesignConfig) => void; onReorderGallery?: (order: number[]) => void;
  onAddPhoto?: (url: string) => void; onAddMusic?: (url: string) => void;
  invitationId: string; galleryPhotos?: string[]; musicFile?: string | null;
  comprehensive: boolean;
}

const SIMPLE_ENVELOPE = ["Classic cream and gold", "Romantic blush pink", "Royal dark with gold", "Modern white and navy"];
const COMP_ENVELOPE = [
  "Complete Chinese wedding envelope — red, gold, lanterns",
  "Dark moody envelope — glowing seal, shimmer text",
  "Vintage lace — ornate floral frame, soft animations",
  "Royal purple — gold particles, gradient glow",
  "Tropical beach — teal gradients, palm leaves",
  "Art deco — geometric gold borders, animated lines",
  "Rustic barn — warm wood tones, botanical overlays",
  "Winter wonderland — snowfall animation, icy blue",
  "Japanese sakura — cherry blossom petals floating",
  "Indian mandala — jewel tones, intricate patterns",
];
const SIMPLE_PAGE = ["Elegant gold and dark theme", "Romantic blush pink palette", "Modern minimalist B&W", "Rustic green garden"];
const COMP_PAGE = [
  "Complete Chinese wedding — red, gold, lanterns, silk patterns",
  "Garden party — soft greens, floral borders, parallax hero",
  "Luxury black and gold — shimmer text, glow effects",
  "Beach tropical — ocean gradients, sunset palette",
  "Royal Indian wedding — jewel tones, paisley, mandala",
  "Rustic barn — earth tones, wood textures, botanicals",
  "Modern minimalist — clean white, elegant typography",
  "Japanese sakura — cherry blossoms, pink gradients",
  "Art deco gatsby — geometric gold, bold typography",
  "Winter wonderland — icy blues, snowfall, silver accents",
];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp3"];

export default function AIChatPanel({
  mode, currentConfig, onApplyConfig, onReorderGallery, onAddPhoto, onAddMusic,
  invitationId, galleryPhotos, musicFile, comprehensive,
}: AIChatPanelProps) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<DesignConfig[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = mode === "envelope"
    ? (comprehensive ? COMP_ENVELOPE : SIMPLE_ENVELOPE)
    : (comprehensive ? COMP_PAGE : SIMPLE_PAGE);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading, currentPhase]);
  useEffect(() => {
    if (taRef.current) { taRef.current.style.height = "auto"; taRef.current.style.height = Math.min(taRef.current.scrollHeight, 120) + "px"; }
  }, [input]);

  // ── Regular design call (fast, works for both modes) ──────────
  async function sendDesign(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    setMsgs(prev => [...prev, { id: genId(), role: "user", content: t }]);
    setInput(""); setError(""); setLoading(true);

    try {
      const res = await fetch("/api/designer/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: t, currentConfig, invitationId, galleryPhotos: galleryPhotos || [], mode, comprehensive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setMsgs(prev => [...prev, { id: genId(), role: "assistant", content: data.message || "Ready. Click Apply.", config: data.config, galleryOrder: data.galleryOrder }]);
    } catch (err) {
      const m = err instanceof Error ? err.message : "Error";
      setError(m);
      setMsgs(prev => [...prev, { id: genId(), role: "assistant", content: `Error: ${m}` }]);
    } finally { setLoading(false); }
  }

  // ── Deep design call (long, 3-phase pipeline) ─────────────────
  async function sendDeepDesign(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    setMsgs(prev => [...prev, { id: genId(), role: "user", content: t }]);
    setInput(""); setError(""); setLoading(true);
    setCurrentPhase("🔍 Planning design elements...");
    setMsgs(prev => [...prev, { id: genId(), role: "system", content: "🔍 Phase 1/3 — Planning design elements..." }]);

    try {
      const res = await fetch("/api/designer/deep-design", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: t, currentConfig, invitationId, galleryPhotos: galleryPhotos || [], mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);

      // Show phase summaries
      const phaseLogs = data.phases || [];
      const planCount = phaseLogs.filter((x: { phase: string }) => x.phase === "plan").length;
      const imgCount = data.images?.length || 0;

      if (planCount > 0) setMsgs(prev => [...prev, { id: genId(), role: "system", content: `✅ Phase 1 — ${planCount} planning steps` }]);
      if (imgCount > 0) setMsgs(prev => [...prev, { id: genId(), role: "system", content: `🎨 Phase 2 — ${imgCount} images generated` }]);
      setMsgs(prev => [...prev, { id: genId(), role: "system", content: "🏗️ Phase 3 — Design assembled" }]);

      // Auto-add generated images to gallery
      if (data.images?.length > 0 && onAddPhoto) {
        for (const img of data.images) onAddPhoto(img.url);
      }

      setMsgs(prev => [...prev, {
        id: genId(), role: "assistant",
        content: data.message || "Deep design complete. Click Apply.",
        config: data.config, galleryOrder: data.galleryOrder, images: data.images,
      }]);
    } catch (err) {
      const m = err instanceof Error ? err.message : "Error";
      setError(m);
      setMsgs(prev => [...prev, { id: genId(), role: "assistant", content: `Error: ${m}` }]);
    } finally { setLoading(false); setCurrentPhase(""); }
  }

  // ── Dispatch: regular send by default, deep design on preset click ──
  function send(text: string) { sendDesign(text); }
  function sendPreset(text: string) { if (comprehensive) sendDeepDesign(text); else sendDesign(text); }

  // ── File upload ───────────────────────────────────────────────
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploading(true); setError("");
    try {
      for (const file of fileArray) {
        const isAudio = AUDIO_TYPES.includes(file.type);
        const isImage = IMAGE_TYPES.includes(file.type);
        if (!isAudio && !isImage) { setError(`Invalid type: ${file.type}`); continue; }
        const fd = new FormData();
        fd.append("file", file); fd.append("invitationId", invitationId);
        fd.append("type", isAudio ? "music" : "gallery");
        const response = await fetch("/api/upload", { method: "POST", body: fd });
        if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.error || "Upload failed"); }
        const data = await response.json();
        const url = data.url || data.path;
        if (url && isAudio && onAddMusic) { onAddMusic(url); setMsgs(prev => [...prev, { id: genId(), role: "assistant", content: `🎵 Music uploaded` }]); }
        else if (url && isImage && onAddPhoto) { onAddPhoto(url); setMsgs(prev => [...prev, { id: genId(), role: "assistant", content: `📷 Photo added to gallery` }]); }
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }, [invitationId, onAddPhoto, onAddMusic]);

  function apply(c: Partial<DesignConfig>, go?: number[]) {
    setHistory(prev => [...prev, currentConfig]);
    onApplyConfig({ ...currentConfig, ...c });
    if (go && onReorderGallery) onReorderGallery(go);
  }

  function undo() {
    if (!history.length) return;
    onApplyConfig(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
  }

  const label = mode === "envelope" ? "Envelope" : "Page";
  const busy = loading || uploading;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a4a] shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${busy ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
          <span className="text-xs text-white/60 font-medium">{label} AI {comprehensive ? "(Full)" : "(Style)"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {galleryPhotos && galleryPhotos.length > 0 && <span className="text-[9px] text-[#c9a96e]/60 bg-[#c9a96e]/10 px-1.5 py-0.5 rounded">{galleryPhotos.length} photos</span>}
          {musicFile && <span className="text-[9px] text-purple-400/60 bg-purple-500/10 px-1.5 py-0.5 rounded">♪</span>}
          {history.length > 0 && <button type="button" onClick={undo} className="px-2 py-1 rounded text-xs text-white/60 hover:text-white bg-white/5 border border-white/10 cursor-pointer">Undo ({history.length})</button>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#ed5566]/20 to-[#c9a96e]/20 border border-[#ed5566]/20 flex items-center justify-center mb-3">
              {mode === "envelope"
                ? <svg className="w-5 h-5 text-[#c9a96e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                : <svg className="w-5 h-5 text-[#ed5566]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
            </div>
            <h3 className="text-white font-medium text-sm mb-1">{label} Designer</h3>
            <p className="text-white/40 text-xs max-w-[280px] leading-relaxed mb-1">
              {comprehensive ? "Click a preset for deep AI design (1-5 min), or type for quick changes." : "Quick color and font changes."}
            </p>
            {comprehensive && <p className="text-[10px] text-amber-400/50 mb-3">Presets run 3-phase pipeline with AI image generation</p>}
            <div className="flex flex-wrap gap-1.5 justify-center max-w-[340px]">
              {presets.slice(0, 6).map(preset => (
                <button key={preset} type="button" onClick={() => sendPreset(preset)} className="px-2.5 py-1 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-[#ed5566]/10 hover:border-[#ed5566]/30 transition-all cursor-pointer text-left">
                  {preset.length > 55 ? preset.slice(0, 52) + "..." : preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map(m => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : m.role === "system" ? "justify-center" : "justify-start"}`}>
            {m.role === "system" ? (
              <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50 font-medium">{m.content}</div>
            ) : (
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${m.role === "user" ? "bg-[#ed5566] text-white rounded-tr-sm" : "bg-[#1a1a2e] border border-[#2a2a4a] text-white/90 rounded-tl-sm"}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                {m.images && m.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {m.images.map((img, i) => (
                      <div key={i} className="relative">
                        <img src={img.url} alt={img.description} className="rounded-lg w-full aspect-square object-cover border border-white/10" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-white/70 px-1 py-0.5 rounded-b-lg truncate">{img.description}</div>
                      </div>
                    ))}
                  </div>
                )}
                {m.role === "assistant" && m.config && (
                  <div className="mt-2.5 pt-2.5 border-t border-white/10">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {m.config.primaryColor && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/50"><span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: m.config.primaryColor }} />Primary</span>}
                      {m.config.backgroundColor && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/50"><span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: m.config.backgroundColor }} />Bg</span>}
                      {m.config.primaryFont && <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/50">{m.config.primaryFont}</span>}
                      {m.config.customCss && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-[9px] text-purple-400">CSS</span>}
                      {m.config.customHtml && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[9px] text-blue-400">HTML</span>}
                    </div>
                    <button type="button" onClick={() => apply(m.config || {}, m.galleryOrder)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#ed5566] hover:bg-[#d4444f] text-white text-xs font-medium cursor-pointer">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Apply Design
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="flex flex-col items-center gap-2">
            {currentPhase && <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-medium animate-pulse">{currentPhase}</div>}
            <div className="flex justify-start w-full">
              <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="text-[10px] text-white/40 ml-1">{uploading ? "Uploading..." : currentPhase ? "Deep designing..." : "Designing..."}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="mx-4 mb-1 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <span className="truncate">{error}</span>
          <button type="button" onClick={() => setError("")} className="ml-2 shrink-0 cursor-pointer">✕</button>
        </div>
      )}

      {msgs.length > 0 && !busy && (
        <div className="px-4 py-1 shrink-0">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {presets.slice(0, 3).map(preset => (
              <button key={preset} type="button" onClick={() => sendPreset(preset)} className="px-2 py-0.5 rounded-full text-[9px] whitespace-nowrap bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-[#ed5566]/10 transition-all shrink-0 cursor-pointer">
                {preset.length > 40 ? preset.slice(0, 37) + "..." : preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {galleryPhotos && galleryPhotos.length > 0 && (
        <div className="px-4 py-1.5 border-t border-[#2a2a4a] shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {galleryPhotos.map((url, i) => (
              <div key={`t-${i}`} className="w-8 h-8 rounded overflow-hidden border border-white/10 shrink-0 relative group">
                <img src={url} alt={`[${i}]`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white font-mono transition-opacity">[{i}]</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-3 pt-2 border-t border-[#2a2a4a] shrink-0">
        <div className="flex items-end gap-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="p-2.5 rounded-xl bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/10 transition-all shrink-0 cursor-pointer disabled:opacity-30"
            title="Upload photo or music">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,audio/mpeg" multiple
            onChange={e => { if (e.target.files) handleFileUpload(e.target.files); }} className="hidden" />
          <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={comprehensive ? `Type for quick changes, or click presets for deep design...` : `Change ${mode} colors/fonts...`}
            rows={1} disabled={busy}
            className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:border-[#ed5566]/50 transition-all disabled:opacity-50"
            style={{ maxHeight: 120 }} />
          <button type="button" onClick={() => send(input)} disabled={!input.trim() || busy}
            className="p-2.5 rounded-xl bg-[#ed5566] text-white hover:bg-[#d4444f] disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";

interface DesignConfig {
  primaryFont: string;
  backgroundColor: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundImage: string;
  envelopeBgColor?: string;
  envelopePaperColor?: string;
  envelopeTextColor?: string;
  enableGallery: boolean;
  enableRsvp: boolean;
  enableCountdown: boolean;
  enableMessages: boolean;
  sectionOrder?: string[];
  customCss: string;
  customHtml?: string;
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  config?: Partial<DesignConfig>;
  galleryOrder?: number[];
}

interface AIChatPanelProps {
  mode: "envelope" | "invitation";
  currentConfig: DesignConfig;
  onApplyConfig: (config: DesignConfig) => void;
  onReorderGallery?: (order: number[]) => void;
  invitationId: string;
  galleryPhotos?: string[];
  comprehensive: boolean;
}

const SIMPLE_ENVELOPE = [
  "Classic cream and gold colors",
  "Romantic blush pink style",
  "Royal dark with gold accents",
  "Modern white and navy",
];

const COMP_ENVELOPE = [
  "Completely redesign with floating gold particles and shimmer text",
  "Dark moody envelope with glowing wax seal animation",
  "Elegant with animated gradient background and decorative borders",
  "Vintage with textured paper effect and ornate frame",
];

const SIMPLE_PAGE = [
  "Elegant gold and dark theme",
  "Romantic blush pink palette",
  "Modern minimalist black and white",
  "Rustic green garden theme",
];

const COMP_PAGE = [
  "Completely redesign with parallax hero using photo[0] as background, animated text, floating elements",
  "Create a stunning page with photo overlays, shimmer gold text, and animated section transitions",
  "Design with photo[0] as hero bg, gradient overlay text, custom countdown style, decorative CSS borders",
  "Bold dark theme with glow effects, animated gradient sections, and photo backgrounds with text overlays",
  "Use photo[1] as a full-width section divider with couple names overlaid in large script font",
  "Add floating petal animations, parallax scrolling, and decorative SVG corner elements",
];

export default function AIChatPanel({
  mode,
  currentConfig,
  onApplyConfig,
  onReorderGallery,
  invitationId,
  galleryPhotos,
  comprehensive,
}: AIChatPanelProps) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<DesignConfig[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const prompts = mode === "envelope"
    ? (comprehensive ? COMP_ENVELOPE : SIMPLE_ENVELOPE)
    : (comprehensive ? COMP_PAGE : SIMPLE_PAGE);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    setMsgs(p => [...p, { id: crypto.randomUUID(), role: "user", content: t }]);
    setInput(""); setError(""); setLoading(true);

    try {
      const res = await fetch("/api/designer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: t, currentConfig, invitationId, galleryPhotos: galleryPhotos || [], mode, comprehensive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setMsgs(p => [...p, { id: crypto.randomUUID(), role: "assistant", content: data.message || "Ready. Click Apply.", config: data.config, galleryOrder: data.galleryOrder }]);
    } catch (err) {
      const m = err instanceof Error ? err.message : "Error";
      setError(m);
      setMsgs(p => [...p, { id: crypto.randomUUID(), role: "assistant", content: `Error: ${m}` }]);
    } finally { setLoading(false); }
  }

  function apply(c: Partial<DesignConfig>, go?: number[]) {
    setHistory(p => [...p, currentConfig]);
    onApplyConfig({ ...currentConfig, ...c });
    if (go && onReorderGallery) onReorderGallery(go);
  }

  function undo() {
    if (!history.length) return;
    onApplyConfig(history[history.length - 1]);
    setHistory(p => p.slice(0, -1));
  }

  const label = mode === "envelope" ? "Envelope" : "Page";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a4a] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/60 font-medium">{label} AI {comprehensive ? "(Full)" : "(Style)"}</span>
        </div>
        {history.length > 0 && (
          <button type="button" onClick={undo} className="px-2 py-1 rounded text-xs text-white/60 hover:text-white bg-white/5 border border-white/10 cursor-pointer">Undo ({history.length})</button>
        )}
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
            <p className="text-white/40 text-xs max-w-[280px] leading-relaxed mb-4">
              {comprehensive
                ? `Full ${label.toLowerCase()} redesign — animations, custom CSS/HTML, photo backgrounds, text overlays, dynamic elements.`
                : `Quick style changes — colors and fonts only.`}
              {galleryPhotos && galleryPhotos.length > 0 && comprehensive && (
                <span className="block mt-1 text-[#c9a96e]/60">{galleryPhotos.length} photo(s) available. Reference as photo[0]-photo[{galleryPhotos.length - 1}].</span>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center max-w-[340px]">
              {prompts.map(p => (
                <button key={p} type="button" onClick={() => send(p)} className="px-2.5 py-1 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-[#ed5566]/10 hover:border-[#ed5566]/30 transition-all cursor-pointer text-left">
                  {p.length > 60 ? p.slice(0, 57) + "..." : p}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map(m => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${m.role === "user" ? "bg-[#ed5566] text-white rounded-tr-sm" : "bg-[#1a1a2e] border border-[#2a2a4a] text-white/90 rounded-tl-sm"}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              {m.role === "assistant" && (m.config || m.galleryOrder) && (
                <div className="mt-2.5 pt-2.5 border-t border-white/10">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {m.config?.primaryColor && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/50"><span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: m.config.primaryColor }} />Primary</span>}
                    {m.config?.backgroundColor && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/50"><span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: m.config.backgroundColor }} />Bg</span>}
                    {m.config?.primaryFont && <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/50">{m.config.primaryFont}</span>}
                    {m.config?.customCss && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-[9px] text-purple-400">CSS</span>}
                    {m.config?.customHtml && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[9px] text-blue-400">HTML</span>}
                  </div>
                  <button type="button" onClick={() => apply(m.config || {}, m.galleryOrder)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#ed5566] hover:bg-[#d4444f] text-white text-xs font-medium cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" style={{ animationDelay: "300ms" }} />
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

      {msgs.length > 0 && !loading && (
        <div className="px-4 py-1 shrink-0">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {prompts.slice(0, 3).map(p => (
              <button key={p} type="button" onClick={() => send(p)} className="px-2 py-0.5 rounded-full text-[9px] whitespace-nowrap bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-[#ed5566]/10 transition-all shrink-0 cursor-pointer">
                {p.length > 40 ? p.slice(0, 37) + "..." : p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-3 pt-2 border-t border-[#2a2a4a] shrink-0">
        <div className="flex items-end gap-2">
          <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} placeholder={comprehensive ? `Describe your ${mode} design in detail...` : `Change ${mode} colors/fonts...`} rows={1} disabled={loading} className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:border-[#ed5566]/50 transition-all disabled:opacity-50" style={{ maxHeight: 120 }} />
          <button type="button" onClick={() => send(input)} disabled={!input.trim() || loading} className="p-2.5 rounded-xl bg-[#ed5566] text-white hover:bg-[#d4444f] disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

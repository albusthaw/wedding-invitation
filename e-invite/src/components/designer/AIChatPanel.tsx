"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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
  imageUrl?: string;
}

interface AIChatPanelProps {
  mode: "envelope" | "invitation";
  currentConfig: DesignConfig;
  onApplyConfig: (config: DesignConfig) => void;
  onReorderGallery?: (order: number[]) => void;
  onAddPhoto?: (url: string) => void;
  onAddMusic?: (url: string) => void;
  invitationId: string;
  galleryPhotos?: string[];
  musicFile?: string | null;
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
  "Generate AI flower decorations for the envelope corners",
];

const SIMPLE_PAGE = [
  "Elegant gold and dark theme",
  "Romantic blush pink palette",
  "Modern minimalist black and white",
  "Rustic green garden theme",
];

const COMP_PAGE = [
  "Completely redesign with parallax hero using photo[0] as background, animated text, floating elements",
  "Chinese wedding design with red and gold, generate lantern and flower decorations",
  "Design with photo[0] as hero bg, gradient overlay text, custom countdown style",
  "Bold dark theme with glow effects, animated gradient sections",
  "Generate floral border decorations and use them throughout the page",
  "Add floating petal animations, parallax scrolling, and decorative elements",
];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp3"];

export default function AIChatPanel({
  mode,
  currentConfig,
  onApplyConfig,
  onReorderGallery,
  onAddPhoto,
  onAddMusic,
  invitationId,
  galleryPhotos,
  musicFile,
  comprehensive,
}: AIChatPanelProps) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<DesignConfig[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Generate AI design element image
  const generateAIImage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || generatingImage) return;
    setGeneratingImage(true);
    setError("");
    setMsgs(p => [...p, { id: crypto.randomUUID(), role: "user", content: `🎨 Generate image: ${prompt}` }]);

    try {
      const res = await fetch("/api/designer/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          invitationId,
          context: mode === "envelope"
            ? "Design element for wedding envelope opener page"
            : "Design element for wedding invitation page",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image generation failed");

      setMsgs(p => [...p, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.description || "AI design element generated! Click 'Add to Gallery' to use it.",
        imageUrl: data.url,
      }]);
    } catch (err) {
      const m = err instanceof Error ? err.message : "Image generation error";
      setError(m);
      setMsgs(p => [...p, { id: crypto.randomUUID(), role: "assistant", content: `Error: ${m}` }]);
    } finally { setGeneratingImage(false); }
  }, [generatingImage, invitationId, mode]);

  // Upload photo/music files
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploading(true);
    setError("");

    try {
      for (const file of fileArray) {
        const isAudio = AUDIO_TYPES.includes(file.type);
        const isImage = IMAGE_TYPES.includes(file.type);
        if (!isAudio && !isImage) {
          setError(`Invalid file type: ${file.type}. Use JPG, PNG, WebP for photos or MP3 for music.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("invitationId", invitationId);
        formData.append("type", isAudio ? "music" : "gallery");

        const response = await fetch("/api/upload", { method: "POST", body: formData });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Upload failed for ${file.name}`);
        }

        const data = await response.json();
        const url = data.url || data.path;
        if (url) {
          if (isAudio && onAddMusic) {
            onAddMusic(url);
            setMsgs(p => [...p, { id: crypto.randomUUID(), role: "assistant", content: `🎵 Music uploaded: ${file.name}` }]);
          } else if (isImage && onAddPhoto) {
            onAddPhoto(url);
            setMsgs(p => [...p, { id: crypto.randomUUID(), role: "assistant", content: `📷 Photo uploaded: ${file.name}${data.wasOptimized ? " (auto-optimized)" : ""}` }]);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [invitationId, onAddPhoto, onAddMusic]);

  function apply(c: Partial<DesignConfig>, go?: number[]) {
    setHistory(p => [...p, currentConfig]);
    onApplyConfig({ ...currentConfig, ...c });
    if (go && onReorderGallery) onReorderGallery(go);
  }

  function addImageToGallery(url: string) {
    if (onAddPhoto) onAddPhoto(url);
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
        <div className="flex items-center gap-1.5">
          {/* Photo count */}
          {galleryPhotos && galleryPhotos.length > 0 && (
            <span className="text-[9px] text-[#c9a96e]/60 bg-[#c9a96e]/10 px-1.5 py-0.5 rounded">
              {galleryPhotos.length} photo{galleryPhotos.length !== 1 ? "s" : ""}
            </span>
          )}
          {musicFile && (
            <span className="text-[9px] text-purple-400/60 bg-purple-500/10 px-1.5 py-0.5 rounded">♪</span>
          )}
          {history.length > 0 && (
            <button type="button" onClick={undo} className="px-2 py-1 rounded text-xs text-white/60 hover:text-white bg-white/5 border border-white/10 cursor-pointer">Undo ({history.length})</button>
          )}
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
            <p className="text-white/40 text-xs max-w-[280px] leading-relaxed mb-4">
              {comprehensive
                ? `Full ${label.toLowerCase()} redesign — animations, CSS/HTML, AI-generated images, photo backgrounds.`
                : `Quick style changes — colors and fonts only.`}
              {galleryPhotos && galleryPhotos.length > 0 && comprehensive && (
                <span className="block mt-1 text-[#c9a96e]/60">{galleryPhotos.length} photo(s). Reference as photo[0]-photo[{galleryPhotos.length - 1}].</span>
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

              {/* AI generated image */}
              {m.imageUrl && (
                <div className="mt-2">
                  <img src={m.imageUrl} alt="AI generated" className="rounded-lg max-h-48 w-auto border border-white/10" />
                  <button type="button" onClick={() => addImageToGallery(m.imageUrl!)} className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c9a96e]/20 hover:bg-[#c9a96e]/30 text-[#c9a96e] text-xs font-medium cursor-pointer border border-[#c9a96e]/20">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add to Gallery
                  </button>
                </div>
              )}

              {/* Design config apply button */}
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

        {(loading || generatingImage || uploading) && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="text-[10px] text-white/40 ml-1">
                  {generatingImage ? "Generating image..." : uploading ? "Uploading..." : "Designing..."}
                </span>
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

      {msgs.length > 0 && !loading && !generatingImage && (
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

      {/* Gallery thumbnails strip */}
      {galleryPhotos && galleryPhotos.length > 0 && (
        <div className="px-4 py-1.5 border-t border-[#2a2a4a] shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {galleryPhotos.map((url, i) => (
              <div key={`thumb-${i}`} className="w-8 h-8 rounded overflow-hidden border border-white/10 shrink-0 relative group">
                <img src={url} alt={`photo[${i}]`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white font-mono transition-opacity">[{i}]</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area with attachment + AI image buttons */}
      <div className="px-4 pb-3 pt-2 border-t border-[#2a2a4a] shrink-0">
        <div className="flex items-end gap-2">
          {/* Attachment button (upload photo/music) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2.5 rounded-xl bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/10 transition-all shrink-0 cursor-pointer disabled:opacity-30"
            title="Upload photo or music"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,audio/mpeg"
            multiple
            onChange={e => { if (e.target.files) handleFileUpload(e.target.files); }}
            className="hidden"
          />

          {/* AI Image generation button */}
          {comprehensive && (
            <button
              type="button"
              onClick={() => {
                const prompt = input.trim();
                if (prompt) {
                  generateAIImage(prompt);
                  setInput("");
                } else {
                  generateAIImage("Elegant gold floral decoration for wedding invitation");
                }
              }}
              disabled={generatingImage}
              className="p-2.5 rounded-xl bg-[#c9a96e]/10 text-[#c9a96e] hover:bg-[#c9a96e]/20 border border-[#c9a96e]/20 transition-all shrink-0 cursor-pointer disabled:opacity-30"
              title="Generate AI design element image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
          )}

          <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} placeholder={comprehensive ? `Describe your ${mode} design...` : `Change ${mode} colors/fonts...`} rows={1} disabled={loading || generatingImage} className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:border-[#ed5566]/50 transition-all disabled:opacity-50" style={{ maxHeight: 120 }} />
          <button type="button" onClick={() => send(input)} disabled={!input.trim() || loading || generatingImage} className="p-2.5 rounded-xl bg-[#ed5566] text-white hover:bg-[#d4444f] disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

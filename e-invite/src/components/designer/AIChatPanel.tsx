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
}

interface ChatMessage {
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
}

const ENVELOPE_PROMPTS = [
  "Make envelope elegant with dark burgundy background",
  "Use cream and gold colors for the envelope",
  "Make it modern with white paper and dark text",
  "Romantic blush pink envelope style",
  "Royal gold theme envelope",
  "Vintage warm brown envelope",
];

const INVITATION_PROMPTS = [
  "Make the invitation page elegant with gold accents",
  "Use a rustic garden theme with green tones",
  "Modern minimalist white and black",
  "Romantic blush pink color palette",
  "Royal gold theme with dark background",
  "Beach tropical theme with teal colors",
  "Use Cinzel font for a royal look",
  "Add custom CSS for decorative borders",
];

export default function AIChatPanel({
  mode,
  currentConfig,
  onApplyConfig,
  onReorderGallery,
  invitationId,
  galleryPhotos,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [configHistory, setConfigHistory] = useState<DesignConfig[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prompts = mode === "envelope" ? ENVELOPE_PROMPTS : INVITATION_PROMPTS;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  async function doSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/designer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          currentConfig,
          invitationId,
          galleryPhotos: galleryPhotos || [],
          mode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message || "Design ready. Click Apply to preview.",
        config: data.config || undefined,
        galleryOrder: data.galleryOrder || undefined,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      setError(errMsg);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${errMsg}`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleApply(config: Partial<DesignConfig>, galleryOrder?: number[]) {
    setConfigHistory(prev => [...prev, currentConfig]);
    onApplyConfig({ ...currentConfig, ...config });
    if (galleryOrder && onReorderGallery) onReorderGallery(galleryOrder);
  }

  function handleUndo() {
    if (configHistory.length === 0) return;
    onApplyConfig(configHistory[configHistory.length - 1]);
    setConfigHistory(prev => prev.slice(0, -1));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend(input);
    }
  }

  const modeLabel = mode === "envelope" ? "Envelope" : "Invitation Page";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a4a] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/60 font-medium">AI — {modeLabel}</span>
        </div>
        {configHistory.length > 0 && (
          <button type="button" onClick={handleUndo} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer">
            Undo ({configHistory.length})
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ed5566]/20 to-[#c9a96e]/20 border border-[#ed5566]/20 flex items-center justify-center mb-3">
              {mode === "envelope" ? (
                <svg className="w-6 h-6 text-[#c9a96e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              ) : (
                <svg className="w-6 h-6 text-[#ed5566]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              )}
            </div>
            <h3 className="text-white font-medium text-sm mb-1">{modeLabel} Designer</h3>
            <p className="text-white/40 text-xs max-w-[260px] leading-relaxed mb-5">
              {mode === "envelope"
                ? "Describe how you want the envelope page to look. I control the background, paper color, text color, and button style."
                : "Describe the invitation page design. I control colors, fonts, sections, and custom CSS."
              }
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-[340px]">
              {prompts.map(p => (
                <button key={p} type="button" onClick={() => doSend(p)} className="px-3 py-1.5 rounded-full text-[11px] bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-[#ed5566]/10 hover:border-[#ed5566]/30 transition-all cursor-pointer">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-[#ed5566] text-white rounded-tr-sm" : "bg-[#1a1a2e] border border-[#2a2a4a] text-white/90 rounded-tl-sm"}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              {msg.role === "assistant" && (msg.config || msg.galleryOrder) && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  {/* Color previews */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {msg.config?.primaryColor && <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/50"><div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: msg.config.primaryColor }} />Primary</div>}
                    {msg.config?.accentColor && <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/50"><div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: msg.config.accentColor }} />Accent</div>}
                    {msg.config?.backgroundColor && <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/50"><div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: msg.config.backgroundColor }} />Bg</div>}
                    {msg.config?.envelopeBgColor && <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/50"><div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: msg.config.envelopeBgColor }} />Env</div>}
                    {msg.config?.primaryFont && <div className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/50">{msg.config.primaryFont}</div>}
                  </div>
                  <button type="button" onClick={() => handleApply(msg.config || {}, msg.galleryOrder)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#ed5566] hover:bg-[#d4444f] text-white text-xs font-medium transition-all cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Apply Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <span className="truncate">{error}</span>
          <button type="button" onClick={() => setError("")} className="ml-2 shrink-0 cursor-pointer">✕</button>
        </div>
      )}

      {/* Quick prompts when chatting */}
      {messages.length > 0 && !loading && (
        <div className="px-4 py-1.5 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {prompts.slice(0, 4).map(p => (
              <button key={p} type="button" onClick={() => doSend(p)} className="px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-[#ed5566]/10 hover:border-[#ed5566]/30 transition-all shrink-0 cursor-pointer">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-[#2a2a4a] shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Describe your ${mode} design...`}
            rows={1}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all disabled:opacity-50"
            style={{ maxHeight: 120 }}
          />
          <button
            type="button"
            onClick={() => doSend(input)}
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-[#ed5566] text-white hover:bg-[#d4444f] disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
        <p className="text-[10px] text-white/30 mt-1 text-center">Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}

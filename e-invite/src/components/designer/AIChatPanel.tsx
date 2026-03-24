"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DesignConfig {
  primaryFont: string;
  backgroundColor: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundImage: string;
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
  timestamp: Date;
}

interface AIChatPanelProps {
  currentConfig: DesignConfig;
  onApplyConfig: (config: DesignConfig) => void;
  onReorderGallery?: (order: number[]) => void;
  invitationId: string;
  galleryPhotos?: string[];
}

const SUGGESTED_PROMPTS = [
  "Make it elegant with gold accents",
  "Change to rustic garden theme",
  "Use romantic blush pink palette",
  "Make it modern and minimalist",
  "Royal gold theme with dark background",
  "Beach tropical theme",
  "Vintage classic style",
  "Make fonts more dramatic",
];

export default function AIChatPanel({
  currentConfig,
  onApplyConfig,
  onReorderGallery,
  invitationId,
  galleryPhotos,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [configHistory, setConfigHistory] = useState<DesignConfig[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/designer/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text.trim(),
            currentConfig,
            invitationId,
            galleryPhotos: galleryPhotos || [],
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to generate design");
        }

        const data = await response.json();

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message || "Here are the suggested changes:",
          config: data.config || undefined,
          galleryOrder: data.galleryOrder || undefined,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${
            err instanceof Error ? err.message : "Something went wrong"
          }. Please try again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentConfig, invitationId, isLoading, galleryPhotos]
  );

  function handleApplyConfig(config: Partial<DesignConfig>, galleryOrder?: number[]) {
    // Save current config to history for undo
    setConfigHistory((prev) => [...prev, currentConfig]);

    const newConfig: DesignConfig = {
      ...currentConfig,
      ...config,
    };
    onApplyConfig(newConfig);

    // Apply gallery reorder if provided
    if (galleryOrder && onReorderGallery) {
      onReorderGallery(galleryOrder);
    }
  }

  function handleUndo() {
    if (configHistory.length === 0) return;
    const previousConfig = configHistory[configHistory.length - 1];
    setConfigHistory((prev) => prev.slice(0, -1));
    onApplyConfig(previousConfig);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with undo */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a4a] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/60 font-medium">AI Design Assistant</span>
        </div>
        {configHistory.length > 0 && (
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo ({configHistory.length})
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ed5566]/20 to-[#c9a96e]/20 border border-[#ed5566]/20 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-[#ed5566]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-white font-medium text-sm mb-1.5">
              AI Design Assistant
            </h3>
            <p className="text-white/40 text-xs max-w-[240px] leading-relaxed mb-6">
              Describe how you&apos;d like your invitation to look and I&apos;ll generate the design for you.
              {galleryPhotos && galleryPhotos.length > 0 && (
                <span className="block mt-1 text-[#c9a96e]/60">
                  {galleryPhotos.length} gallery photo{galleryPhotos.length !== 1 ? "s" : ""} available for arrangement.
                </span>
              )}
            </p>

            {/* Suggested prompts */}
            <div className="flex flex-wrap gap-2 justify-center max-w-[320px]">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="px-3 py-1.5 rounded-full text-[11px] bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-[#ed5566]/10 hover:border-[#ed5566]/30 transition-all cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-[#ed5566] text-white rounded-tr-sm"
                    : "bg-[#1a1a2e] border border-[#2a2a4a] text-white/90 rounded-tl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>

                {/* Apply config button for AI responses */}
                {message.role === "assistant" && (message.config || message.galleryOrder) && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {/* Show mini preview of changes */}
                      {message.config?.primaryColor && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-[10px] text-white/50">
                          <div
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: message.config.primaryColor }}
                          />
                          Primary
                        </div>
                      )}
                      {message.config?.accentColor && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-[10px] text-white/50">
                          <div
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: message.config.accentColor }}
                          />
                          Accent
                        </div>
                      )}
                      {message.config?.backgroundColor && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-[10px] text-white/50">
                          <div
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: message.config.backgroundColor }}
                          />
                          Background
                        </div>
                      )}
                      {message.config?.primaryFont && (
                        <div className="px-2 py-1 rounded bg-white/5 text-[10px] text-white/50">
                          Font: {message.config.primaryFont}
                        </div>
                      )}
                      {message.galleryOrder && (
                        <div className="px-2 py-1 rounded bg-white/5 text-[10px] text-white/50">
                          Gallery reorder: {message.galleryOrder.length} images
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyConfig(message.config || {}, message.galleryOrder)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#ed5566] hover:bg-[#d4444f] text-white text-xs font-medium transition-all hover:shadow-lg hover:shadow-[#ed5566]/20 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Apply Changes
                    </button>
                  </div>
                )}

                <span className="block text-[10px] mt-1.5 opacity-40">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#ed5566] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts when there are messages */}
      {messages.length > 0 && !isLoading && (
        <div className="px-4 py-2 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-[#ed5566]/10 hover:border-[#ed5566]/30 transition-all shrink-0 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 border-t border-[#2a2a4a] shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your design..."
              rows={1}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all disabled:opacity-50"
              style={{ maxHeight: 120 }}
            />
          </div>
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-[#ed5566] text-white hover:bg-[#d4444f] disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-[#ed5566]/20 shrink-0 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-white/30 mt-1.5 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AIChatPanel from "./AIChatPanel";
import ColorPicker from "./ColorPicker";
import FontSelector from "./FontSelector";
import MediaUploader from "./MediaUploader";
import PreviewPopup from "./PreviewPopup";

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

interface InvitationForDesigner {
  id: string;
  title: string;
  slug: string;
  groomName: string;
  brideName: string;
  published: boolean;
  musicFile: string | null;
  galleryPhotos: string[];
  designConfig: DesignConfig;
}

interface DesignerModalProps {
  invitation: InvitationForDesigner;
  onClose: () => void;
  onSave: (config: DesignConfig, galleryPhotos: string[], musicFile: string | null) => Promise<void>;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
}

type TabId = "envelope-ai" | "page-ai" | "style" | "sections" | "media" | "css";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "envelope-ai",
    label: "Envelope",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "page-ai",
    label: "Page AI",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: "style",
    label: "Style",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
  {
    id: "sections",
    label: "Sections",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    id: "media",
    label: "Media",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "css",
    label: "CSS",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
];

const SECTION_TOGGLES: { key: keyof DesignConfig; label: string; description: string }[] = [
  { key: "enableGallery", label: "Photo Gallery", description: "Display a gallery of photos from your event" },
  { key: "enableRsvp", label: "RSVP Form", description: "Allow guests to confirm their attendance" },
  { key: "enableCountdown", label: "Countdown Timer", description: "Show a countdown to your wedding day" },
  { key: "enableMessages", label: "Message Wall", description: "Let guests leave heartfelt messages" },
];

const CSS_VARIABLES_INFO = `Available CSS variables:
--primary-color      The main theme color
--accent-color       Secondary/gold accent color
--bg-color           Page background color
--text-color         Default text color
--primary-font       The selected heading font

Example usage:
.invitation-hero {
  background: var(--bg-color);
  color: var(--text-color);
  font-family: var(--primary-font);
}

.custom-button {
  background: var(--primary-color);
  border: 1px solid var(--accent-color);
}`;

export default function DesignerModal({
  invitation,
  onClose,
  onSave,
  onPublish,
  onUnpublish,
}: DesignerModalProps) {
  // ── State ──────────────────────────────────────────────────────────
  const [config, setConfig] = useState<DesignConfig>({ ...invitation.designConfig });
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(invitation.galleryPhotos || []);
  const [musicFile, setMusicFile] = useState<string | null>(invitation.musicFile);
  const [activeTab, setActiveTab] = useState<TabId>("envelope-ai");
  const [comprehensive, setComprehensive] = useState(true);
  const [mobileView, setMobileView] = useState<"controls" | "preview">("controls");
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Serialized initial state for dirty checking
  const initialStateRef = useRef(
    JSON.stringify({
      config: invitation.designConfig,
      galleryPhotos: invitation.galleryPhotos || [],
      musicFile: invitation.musicFile,
    })
  );

  // ── Dirty tracking ─────────────────────────────────────────────────
  useEffect(() => {
    const currentState = JSON.stringify({ config, galleryPhotos, musicFile });
    setIsDirty(currentState !== initialStateRef.current);
  }, [config, galleryPhotos, musicFile]);

  // ── Keyboard / scroll lock ─────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !showPreviewPopup) {
        if (isDirty) {
          const confirmed = window.confirm(
            "You have unsaved changes. Are you sure you want to close?"
          );
          if (!confirmed) return;
        }
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, showPreviewPopup, isDirty]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ── Preview refresh key ────────────────────────────────────────────
  const previewKey = JSON.stringify(config) + galleryPhotos.length + (musicFile || "");

  // ── Helpers ────────────────────────────────────────────────────────
  const updateConfig = useCallback((partial: Partial<DesignConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleAIApplyConfig = useCallback(
    (newConfig: DesignConfig) => {
      setConfig((prev) => ({ ...prev, ...newConfig }));
    },
    []
  );

  const [saveMsg, setSaveMsg] = useState("");

  async function handleSave() {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveMsg("");
    try {
      await onSave(config, galleryPhotos, musicFile);
      initialStateRef.current = JSON.stringify({ config, galleryPhotos, musicFile });
      setIsDirty(false);

      // Auto-publish if already published
      if (invitation.published) {
        await onPublish();
        setSaveMsg("Saved & Published");
      } else {
        setSaveMsg("Saved as Draft");
      }
      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); setSaveMsg(""); }, 3000);
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublishToggle() {
    setIsPublishing(true);
    try {
      if (invitation.published) {
        await onUnpublish();
      } else {
        await onPublish();
      }
    } finally {
      setIsPublishing(false);
    }
  }

  function handleCloseClick() {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirmed) return;
    }
    onClose();
  }

  function handleGalleryUpload(urls: string[]) {
    setGalleryPhotos((prev) => [...prev, ...urls]);
  }

  function handleGalleryDelete(url: string) {
    setGalleryPhotos((prev) => prev.filter((p) => p !== url));
  }

  function handleMusicUpload(urls: string[]) {
    if (urls.length > 0) {
      setMusicFile(urls[0]);
    }
  }

  function handleMusicDelete() {
    setMusicFile(null);
  }

  const handleGalleryReorder = useCallback((order: number[]) => {
    setGalleryPhotos((prev) => {
      const reordered: string[] = [];
      for (const idx of order) {
        if (idx >= 0 && idx < prev.length) {
          reordered.push(prev[idx]);
        }
      }
      // Add any photos not in the order array at the end
      for (let i = 0; i < prev.length; i++) {
        if (!order.includes(i)) {
          reordered.push(prev[i]);
        }
      }
      return reordered;
    });
  }, []);

  // ── Tab content renderers ──────────────────────────────────────────
  function renderEnvelopeAITab() {
    return (
      <AIChatPanel
        mode="envelope"
        currentConfig={config}
        onApplyConfig={handleAIApplyConfig}
        invitationId={invitation.id}
        comprehensive={comprehensive}
      />
    );
  }

  function renderPageAITab() {
    return (
      <AIChatPanel
        mode="invitation"
        currentConfig={config}
        onApplyConfig={handleAIApplyConfig}
        onReorderGallery={handleGalleryReorder}
        invitationId={invitation.id}
        galleryPhotos={galleryPhotos}
        comprehensive={comprehensive}
      />
    );
  }

  function renderStyleTab() {
    return (
      <div className="p-4 space-y-5 overflow-y-auto h-full custom-scrollbar">
        <FontSelector
          value={config.primaryFont}
          onChange={(font) => updateConfig({ primaryFont: font })}
        />

        <div className="pt-3 border-t border-white/5">
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            Colors
          </h4>
          <div className="space-y-3">
            <ColorPicker
              label="Primary Color"
              value={config.primaryColor}
              onChange={(color) => updateConfig({ primaryColor: color })}
            />
            <ColorPicker
              label="Accent Color"
              value={config.accentColor}
              onChange={(color) => updateConfig({ accentColor: color })}
            />
            <ColorPicker
              label="Background Color"
              value={config.backgroundColor}
              onChange={(color) => updateConfig({ backgroundColor: color })}
            />
            <ColorPicker
              label="Text Color"
              value={config.textColor}
              onChange={(color) => updateConfig({ textColor: color })}
            />
          </div>
        </div>

        {/* Background image */}
        <div className="pt-3 border-t border-white/5">
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            Background Image
          </h4>
          {config.backgroundImage && (
            <div className="relative mb-3 rounded-lg overflow-hidden border border-white/10">
              <img
                src={config.backgroundImage}
                alt="Background"
                className="w-full h-32 object-cover"
              />
              <button
                type="button"
                onClick={() => updateConfig({ backgroundImage: "" })}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/80 hover:text-white hover:bg-red-500/80 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <MediaUploader
            type="gallery"
            currentFiles={[]}
            onUpload={(urls) => {
              if (urls.length > 0) updateConfig({ backgroundImage: urls[0] });
            }}
            onDelete={() => {}}
            invitationId={invitation.id}
          />
        </div>
      </div>
    );
  }

  function renderSectionsTab() {
    return (
      <div className="p-4 space-y-4 overflow-y-auto h-full custom-scrollbar">
        <p className="text-xs text-white/40 leading-relaxed">
          Enable or disable sections on your invitation page.
        </p>

        <div className="space-y-2">
          {SECTION_TOGGLES.map(({ key, label, description }) => {
            const isEnabled = config[key] as boolean;
            return (
              <div
                key={key}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isEnabled
                    ? "bg-white/5 border-white/10"
                    : "bg-white/[0.02] border-white/5"
                }`}
              >
                {/* Label & description */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium transition-colors ${isEnabled ? "text-white" : "text-white/40"}`}>
                    {label}
                  </p>
                  <p className={`text-[11px] mt-0.5 transition-colors ${isEnabled ? "text-white/40" : "text-white/25"}`}>
                    {description}
                  </p>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() =>
                    updateConfig({ [key]: !isEnabled } as Partial<DesignConfig>)
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    isEnabled ? "bg-[#ed5566]" : "bg-white/10"
                  }`}
                  role="switch"
                  aria-checked={isEnabled}
                  aria-label={`Toggle ${label}`}
                >
                  <motion.div
                    className="absolute top-[2px] w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{ left: isEnabled ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderMediaTab() {
    return (
      <div className="p-4 space-y-6 overflow-y-auto h-full custom-scrollbar">
        {/* Gallery photos */}
        <div>
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
            Gallery Photos <span className="text-white/20">({galleryPhotos.length}/6)</span>
          </h4>
          <p className="text-[10px] text-white/30 mb-3">
            Photos are labeled photo[0]-photo[5]. Reference them in Page AI for section backgrounds and overlays.
          </p>
          <MediaUploader
            type="gallery"
            currentFiles={galleryPhotos}
            onUpload={handleGalleryUpload}
            onDelete={handleGalleryDelete}
            invitationId={invitation.id}
            maxPhotos={6}
          />
        </div>

        {/* Background music */}
        <div className="pt-4 border-t border-white/5">
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            Background Music
          </h4>
          <MediaUploader
            type="music"
            currentFiles={musicFile ? [musicFile] : []}
            onUpload={handleMusicUpload}
            onDelete={handleMusicDelete}
            invitationId={invitation.id}
          />
          {musicFile && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-[#c9a96e]/5 border border-[#c9a96e]/20">
              <div className="w-8 h-8 rounded-lg bg-[#c9a96e]/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#c9a96e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70 truncate">
                  {musicFile.split("/").pop() || "Music file"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleMusicDelete}
                className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                title="Remove music"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderCSSTab() {
    return (
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider">
            Custom CSS
          </h4>
          <span className="text-[10px] text-[#c9a96e]/60 bg-[#c9a96e]/10 px-2 py-0.5 rounded-full">
            Advanced
          </span>
        </div>

        <p className="text-[11px] text-white/30 mb-3 leading-relaxed">
          Add custom CSS to fine-tune your invitation&apos;s appearance. Changes are reflected in the live preview.
        </p>

        <textarea
          value={config.customCss}
          onChange={(e) => updateConfig({ customCss: e.target.value })}
          placeholder={`.invitation-hero {\n  /* your custom styles */\n}`}
          spellCheck={false}
          className="flex-1 min-h-[200px] w-full px-4 py-3 rounded-xl bg-[#0d0d1a] border border-white/10 text-white text-xs font-mono leading-relaxed placeholder-white/20 resize-none focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all"
        />

        {/* CSS Variables reference */}
        <details className="mt-3 group">
          <summary className="flex items-center gap-2 cursor-pointer text-xs text-white/40 hover:text-white/60 transition-colors select-none">
            <svg
              className="w-3.5 h-3.5 transition-transform group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Available CSS Variables
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-[#0d0d1a] border border-white/5 text-[10px] text-white/30 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {CSS_VARIABLES_INFO}
          </pre>
        </details>
      </div>
    );
  }

  function renderTabContent() {
    switch (activeTab) {
      case "envelope-ai":
        return renderEnvelopeAITab();
      case "page-ai":
        return renderPageAITab();
      case "style":
        return renderStyleTab();
      case "sections":
        return renderSectionsTab();
      case "media":
        return renderMediaTab();
      case "css":
        return renderCSSTab();
      default:
        return null;
    }
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col bg-[#0d0d1a]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[#2a2a4a] shrink-0 bg-[#1a1a2e]/80 backdrop-blur-sm">
          {/* Left: close + title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleCloseClick}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
              title="Close designer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white truncate">
                  {invitation.title || `${invitation.groomName} & ${invitation.brideName}`}
                </h2>
                {isDirty && (
                  <span className="shrink-0 w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
                )}
              </div>
              <p className="text-[10px] text-white/40 truncate">
                /{invitation.slug}
              </p>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Comprehensive toggle */}
            <div className="hidden sm:flex items-center gap-1.5 mr-1">
              <span className="text-[10px] text-white/40">{comprehensive ? "Full" : "Style"}</span>
              <button
                type="button"
                onClick={() => setComprehensive(!comprehensive)}
                className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${comprehensive ? "bg-[#ed5566]" : "bg-white/10"}`}
                title={comprehensive ? "Comprehensive design mode (CSS, HTML, animations)" : "Style-only mode (colors, fonts)"}
              >
                <motion.div className="absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm" animate={{ left: comprehensive ? 18 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
              </button>
            </div>

            {/* Save message toast */}
            <AnimatePresence>
              {saveMsg && (
                <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="hidden md:inline text-[11px] text-emerald-400/80 mr-1">
                  {saveMsg}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Unsaved indicator (text) */}
            <AnimatePresence>
              {isDirty && !saveMsg && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="hidden md:inline text-[11px] text-amber-400/80 mr-1"
                >
                  Unsaved changes
                </motion.span>
              )}
            </AnimatePresence>

            {/* Preview popup button */}
            <button
              type="button"
              onClick={() => setShowPreviewPopup(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="hidden sm:inline">Preview</span>
            </button>

            {/* Save button (green) */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                saveSuccess
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {saveMsg || "Saved!"}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  {invitation.published ? "Save & Publish" : "Save Draft"}
                </>
              )}
            </button>

            {/* Publish / Unpublish toggle */}
            <button
              type="button"
              onClick={handlePublishToggle}
              disabled={isPublishing}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                invitation.published
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                  : "bg-[#ed5566] text-white hover:bg-[#d4444f] shadow-lg shadow-[#ed5566]/20"
              }`}
            >
              {isPublishing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  <span className="hidden sm:inline">
                    {invitation.published ? "Unpublishing..." : "Publishing..."}
                  </span>
                </>
              ) : invitation.published ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span className="hidden sm:inline">Unpublish</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">Publish</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile view toggle ──────────────────────────────────── */}
        <div className="flex lg:hidden border-b border-[#2a2a4a] shrink-0">
          <button
            type="button"
            onClick={() => setMobileView("controls")}
            className={`flex-1 py-2.5 text-xs font-medium text-center transition-all ${
              mobileView === "controls"
                ? "text-[#ed5566] border-b-2 border-[#ed5566] bg-[#ed5566]/5"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Controls
          </button>
          <button
            type="button"
            onClick={() => setMobileView("preview")}
            className={`flex-1 py-2.5 text-xs font-medium text-center transition-all ${
              mobileView === "preview"
                ? "text-[#ed5566] border-b-2 border-[#ed5566] bg-[#ed5566]/5"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Preview
          </button>
        </div>

        {/* ── Main content area ───────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel: controls (360px on desktop) */}
          <div
            className={`w-full lg:w-[360px] xl:w-[360px] shrink-0 flex flex-col border-r border-[#2a2a4a] bg-[#12121f] ${
              mobileView === "preview" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Tab bar */}
            <div className="flex border-b border-[#2a2a4a] shrink-0 overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 shrink-0 ${
                    activeTab === tab.id
                      ? "text-[#ed5566] border-[#ed5566] bg-[#ed5566]/5"
                      : "text-white/50 border-transparent hover:text-white/80 hover:bg-white/5"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline lg:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              {renderTabContent()}
            </div>
          </div>

          {/* Right panel: live preview */}
          <div
            className={`flex-1 flex flex-col bg-[#0a0a14] ${
              mobileView === "controls" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Preview browser chrome bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a4a] shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-[11px] text-white/30 font-mono ml-2">
                  /{invitation.slug}?preview=true
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Refresh preview */}
                <button
                  type="button"
                  onClick={() => {
                    if (iframeRef.current) {
                      iframeRef.current.src = iframeRef.current.src;
                    }
                  }}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                  title="Refresh preview"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                {/* Open in popup */}
                <button
                  type="button"
                  onClick={() => setShowPreviewPopup(true)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                  title="Open preview popup"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Preview iframe */}
            <div className="flex-1 overflow-hidden">
              <iframe
                ref={iframeRef}
                key={previewKey}
                src={`/${invitation.slug}?preview=true`}
                className="w-full h-full border-0"
                title="Invitation Preview"
              />
            </div>
          </div>
        </div>

        {/* ── Mobile bottom tab bar ───────────────────────────────── */}
        <div className="flex lg:hidden border-t border-[#2a2a4a] bg-[#1a1a2e]/90 backdrop-blur-sm shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setMobileView("controls");
              }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all ${
                activeTab === tab.id && mobileView === "controls"
                  ? "text-[#ed5566]"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Preview popup overlay ─────────────────────────────────── */}
      {showPreviewPopup && (
        <PreviewPopup
          slug={invitation.slug}
          onClose={() => setShowPreviewPopup(false)}
        />
      )}
    </>
  );
}

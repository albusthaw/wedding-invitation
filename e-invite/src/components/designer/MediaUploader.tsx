"use client";

import { useState, useRef, useCallback } from "react";

interface MediaUploaderProps {
  type: "gallery" | "music";
  currentFiles: string[];
  onUpload: (urls: string[]) => void;
  onDelete: (url: string) => void;
  invitationId: string;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp3"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

export default function MediaUploader({
  type,
  currentFiles,
  onUpload,
  onDelete,
  invitationId,
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = type === "gallery";
  const acceptedTypes = isImage ? IMAGE_TYPES : AUDIO_TYPES;
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;
  const maxSizeLabel = isImage ? "5MB" : "10MB";
  const acceptAttr = isImage ? "image/jpeg,image/png,image/webp" : "audio/mpeg";

  function validateFile(file: File): string | null {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type: ${file.type}. Accepted: ${isImage ? "JPG, PNG, WebP" : "MP3"}`;
    }
    if (file.size > maxSize) {
      return `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum: ${maxSizeLabel}`;
    }
    return null;
  }

  async function uploadFiles(files: File[]) {
    setError("");
    setUploading(true);
    setUploadProgress(0);

    const uploadedUrls: string[] = [];
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("invitationId", invitationId);
        formData.append("type", type);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Upload failed for ${file.name}`);
        }

        const data = await response.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        }

        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      if (uploadedUrls.length > 0) {
        onUpload(uploadedUrls);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        if (!isImage) {
          // Only allow one music file
          uploadFiles([droppedFiles[0]]);
        } else {
          uploadFiles(droppedFiles);
        }
      }
    },
    [isImage]
  );

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      uploadFiles(selectedFiles);
    }
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-white/60">
        {isImage ? "Gallery Photos" : "Background Music"}
      </label>

      {/* Current files display */}
      {currentFiles.length > 0 && (
        <div className={isImage ? "grid grid-cols-3 gap-2" : "space-y-2"}>
          {currentFiles.map((url, index) =>
            isImage ? (
              <div
                key={url + index}
                className="relative group aspect-square rounded-lg overflow-hidden border border-white/10"
              >
                <img
                  src={url}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => onDelete(url)}
                    className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                    title="Delete photo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={url + index}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="w-10 h-10 rounded-lg bg-[#ed5566]/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#ed5566]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">
                    {url.split("/").pop() || "Music file"}
                  </p>
                  <p className="text-[10px] text-white/40">MP3 Audio</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(url)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Remove music"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* Drag and drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
          isDragging
            ? "border-[#ed5566] bg-[#ed5566]/10 scale-[1.02]"
            : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        {uploading ? (
          <>
            <div className="w-10 h-10 rounded-full border-2 border-[#ed5566] border-t-transparent animate-spin" />
            <p className="text-sm text-white/60">Uploading... {uploadProgress}%</p>
            <div className="w-full max-w-[200px] h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#ed5566] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              {isImage ? (
                <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-white/60">
                <span className="text-[#ed5566] font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-[10px] text-white/40 mt-1">
                {isImage ? "JPG, PNG, WebP" : "MP3"} up to {maxSizeLabel}
              </p>
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttr}
          multiple={isImage}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto text-red-400/60 hover:text-red-400"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

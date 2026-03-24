"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createInvitation } from "@/app/actions/invitation";

export default function NewInvitationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/users", { cache: "no-store" })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!slugEdited && title) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }, [title, slugEdited]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("slug", slug);
      if (selectedUsers.length > 0) {
        formData.set("assignedUsers", JSON.stringify(selectedUsers));
      }
      await createInvitation(formData);
      router.push("/dashboard/invitations");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invitation");
    } finally {
      setLoading(false);
    }
  }

  function toggleUser(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-white/50 hover:text-white text-sm flex items-center gap-1 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          Create New Invitation
        </h1>
        <p className="text-white/50 mt-1 text-sm">
          Fill in the details to create a new wedding invitation
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5 sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-white mb-5">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Invitation Title <span className="text-[#ed5566]">*</span>
              </label>
              <input
                name="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Wedding of John & Jane"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                URL Slug
              </label>
              <div className="flex items-center">
                <span className="text-white/30 text-sm mr-2">/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    setSlugEdited(true);
                  }}
                  placeholder="the-wedding-of-john-jane"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all font-mono text-sm"
                />
              </div>
              <p className="text-white/30 text-xs mt-1">A unique identifier will be appended automatically</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Groom Name <span className="text-[#ed5566]">*</span>
              </label>
              <input
                name="groomName"
                type="text"
                required
                placeholder="John Smith"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Bride Name <span className="text-[#ed5566]">*</span>
              </label>
              <input
                name="brideName"
                type="text"
                required
                placeholder="Jane Doe"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Wedding Details */}
        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5 sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-white mb-5">
            Wedding Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Wedding Date <span className="text-[#ed5566]">*</span>
              </label>
              <input
                name="weddingDate"
                type="date"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Wedding Time <span className="text-[#ed5566]">*</span>
              </label>
              <input
                name="weddingTime"
                type="time"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Wedding Venue <span className="text-[#ed5566]">*</span>
              </label>
              <input
                name="weddingVenue"
                type="text"
                required
                placeholder="Grand Ballroom Hotel"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Wedding Address <span className="text-[#ed5566]">*</span>
              </label>
              <textarea
                name="weddingAddress"
                required
                rows={3}
                placeholder="123 Wedding Lane, Suite 100, City, State 12345"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Google Maps Plus Code
              </label>
              <input
                name="mapPlusCode"
                type="text"
                placeholder="X3XP+44 Mandalay, Myanmar (Burma)"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all"
              />
              <p className="text-white/30 text-xs mt-1">Enter a Google Maps Plus Code to show a map button on the invitation page</p>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5 sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-white mb-5">
            Photos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Groom Photo
              </label>
              <input
                name="groomPhoto"
                type="file"
                accept="image/*"
                className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#ed5566]/10 file:text-[#ed5566] hover:file:bg-[#ed5566]/20 file:cursor-pointer cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Bride Photo
              </label>
              <input
                name="bridePhoto"
                type="file"
                accept="image/*"
                className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#ed5566]/10 file:text-[#ed5566] hover:file:bg-[#ed5566]/20 file:cursor-pointer cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Couple Photo
              </label>
              <input
                name="couplePhoto"
                type="file"
                accept="image/*"
                className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#ed5566]/10 file:text-[#ed5566] hover:file:bg-[#ed5566]/20 file:cursor-pointer cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Assign Users */}
        {users.length > 0 && (
          <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5 sm:p-6">
            <h2 className="font-serif text-lg font-semibold text-white mb-5">
              Assign Users
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {users.map((user) => (
                <label
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.includes(user.id) ? "bg-[#ed5566]/10 border border-[#ed5566]/30" : "bg-white/5 border border-transparent hover:bg-white/10"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#ed5566] focus:ring-[#ed5566]/30"
                  />
                  <div>
                    <p className="text-white text-sm">{user.name}</p>
                    <p className="text-white/40 text-xs">{user.email}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#ed5566] hover:bg-[#d9455a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Save as Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { updateInvitation } from "@/app/actions/invitation";

interface InvitationData {
  id: string;
  title: string;
  slug: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  weddingVenue: string;
  weddingAddress: string;
  mapPlusCode: string | null;
  groomPhoto: string | null;
  bridePhoto: string | null;
  couplePhoto: string | null;
  published: boolean;
  needsRepublish: boolean;
  users: { user: { id: string; name: string; email: string } }[];
}

export default function EditInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [invRes, usersRes] = await Promise.all([
          fetch(`/api/invitations/${id}`),
          fetch("/api/users"),
        ]);

        if (invRes.ok) {
          const data = await invRes.json();
          setInvitation(data);
          setSelectedUsers(data.users?.map((u: { user: { id: string } }) => u.user.id) || []);
        } else {
          setError("Invitation not found");
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch {
        setError("Failed to load invitation");
      } finally {
        setFetchLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (selectedUsers.length > 0) {
        formData.set("assignedUsers", JSON.stringify(selectedUsers));
      }
      await updateInvitation(id, formData);
      router.push("/dashboard/invitations");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update invitation");
    } finally {
      setLoading(false);
    }
  }

  function toggleUser(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((uid) => uid !== userId) : [...prev, userId]
    );
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-[#ed5566] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="text-center py-20">
        <p className="text-white/50 text-lg">Invitation not found</p>
        <button
          onClick={() => router.push("/dashboard/invitations")}
          className="mt-4 text-[#ed5566] hover:underline text-sm"
        >
          Back to Invitations
        </button>
      </div>
    );
  }

  const weddingDateFormatted = invitation.weddingDate
    ? new Date(invitation.weddingDate).toISOString().split("T")[0]
    : "";

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
          Edit Invitation
        </h1>
        <p className="text-white/50 mt-1 text-sm">
          Update the details of this wedding invitation
        </p>
      </div>

      {/* Republish Warning */}
      {invitation.published && invitation.needsRepublish && (
        <div className="mb-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="font-medium">This invitation has unpublished changes</p>
            <p className="text-orange-400/70 mt-1">The published version differs from the current draft. Republish to apply the latest changes.</p>
          </div>
        </div>
      )}

      {invitation.published && !invitation.needsRepublish && (
        <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">This invitation is currently published</p>
            <p className="text-amber-400/70 mt-1">Saving changes will mark it as needing republishing.</p>
          </div>
        </div>
      )}

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
                defaultValue={invitation.title}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#ed5566]/50 focus:ring-1 focus:ring-[#ed5566]/30 transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                URL Slug
              </label>
              <div className="flex items-center">
                <span className="text-white/30 text-sm mr-2">/</span>
                <span className="text-white/50 text-sm font-mono">{invitation.slug}</span>
              </div>
              <p className="text-white/30 text-xs mt-1">Slug cannot be changed after creation</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Groom Name <span className="text-[#ed5566]">*</span>
              </label>
              <input
                name="groomName"
                type="text"
                required
                defaultValue={invitation.groomName}
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
                defaultValue={invitation.brideName}
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
                defaultValue={weddingDateFormatted}
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
                defaultValue={invitation.weddingVenue}
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
                defaultValue={invitation.weddingAddress}
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
                defaultValue={invitation.mapPlusCode || ""}
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
              {invitation.groomPhoto && (
                <div className="mb-2">
                  <img src={invitation.groomPhoto} alt="Groom" className="w-20 h-20 rounded-lg object-cover border border-white/10" />
                </div>
              )}
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
              {invitation.bridePhoto && (
                <div className="mb-2">
                  <img src={invitation.bridePhoto} alt="Bride" className="w-20 h-20 rounded-lg object-cover border border-white/10" />
                </div>
              )}
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
              {invitation.couplePhoto && (
                <div className="mb-2">
                  <img src={invitation.couplePhoto} alt="Couple" className="w-20 h-20 rounded-lg object-cover border border-white/10" />
                </div>
              )}
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
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

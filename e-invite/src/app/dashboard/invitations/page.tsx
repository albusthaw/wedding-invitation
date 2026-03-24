"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Invitation {
  id: string;
  slug: string;
  title: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  published: boolean;
  needsRepublish: boolean;
  createdAt: string;
  _count: { invitees: number; messages: number };
}

export default function InvitationsPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await fetch("/api/invitations", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  async function handleTogglePublish(id: string, currentlyPublished: boolean) {
    setActionLoading(id);
    try {
      const action = currentlyPublished ? "unpublish" : "publish";
      const res = await fetch(`/api/invitations/${id}/${action}`, { method: "POST" });
      if (res.ok) {
        await fetchInvitations();
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this invitation? This action cannot be undone.")) {
      return;
    }
    setActionLoading(id);
    try {
      const res = await fetch(`/api/invitations/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchInvitations();
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCopyLink(slug: string) {
    const url = `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for non-secure contexts or when clipboard API fails
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-[#ed5566] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Invitation Letters
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            Manage all your wedding invitations
          </p>
        </div>
        <Link
          href="/dashboard/invitations/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#ed5566] text-white text-sm font-semibold hover:bg-[#d9455a] transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Invitation
        </Link>
      </div>

      {invitations.length === 0 ? (
        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-12 text-center">
          <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-white/40 text-lg mb-2">No invitations yet</p>
          <p className="text-white/30 text-sm mb-6">Create your first wedding invitation to get started</p>
          <Link
            href="/dashboard/invitations/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#ed5566] text-white text-sm font-semibold hover:bg-[#d9455a] transition-colors"
          >
            Create New Invitation
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2a4a]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Title</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Couple</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Slug</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Date</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a4a]">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white text-sm font-medium">{inv.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white/70 text-sm">{inv.groomName} & {inv.brideName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-[#c9a96e] text-xs bg-[#c9a96e]/10 px-2 py-1 rounded">/{inv.slug}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        inv.published
                          ? inv.needsRepublish
                            ? "bg-orange-500/10 text-orange-400"
                            : "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          inv.published
                            ? inv.needsRepublish ? "bg-orange-400" : "bg-green-400"
                            : "bg-yellow-400"
                        }`} />
                        {inv.published ? (inv.needsRepublish ? "Needs Republish" : "Published") : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white/50 text-sm">
                        {new Date(inv.weddingDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/dashboard/invitations/${inv.id}/edit`)}
                          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleTogglePublish(inv.id, inv.published)}
                          disabled={actionLoading === inv.id}
                          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                          title={inv.published ? "Unpublish" : "Publish"}
                        >
                          {inv.published ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        <a
                          href={`/${inv.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          title="Preview"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <button
                          onClick={() => handleCopyLink(inv.slug)}
                          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          title="Copy Link"
                        >
                          {copied === inv.slug ? (
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          disabled={actionLoading === inv.id}
                          className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {invitations.map((inv) => (
              <div key={inv.id} className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-medium text-sm truncate">{inv.title}</h3>
                    <p className="text-white/50 text-xs mt-0.5">{inv.groomName} & {inv.brideName}</p>
                  </div>
                  <span className={`ml-3 shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    inv.published
                      ? inv.needsRepublish
                        ? "bg-orange-500/10 text-orange-400"
                        : "bg-green-500/10 text-green-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}>
                    {inv.published ? (inv.needsRepublish ? "Needs Republish" : "Published") : "Draft"}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-white/40 mb-4">
                  <span>/{inv.slug}</span>
                  <span>{new Date(inv.weddingDate).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 border-t border-[#2a2a4a] pt-3">
                  <button
                    onClick={() => router.push(`/dashboard/invitations/${inv.id}/edit`)}
                    className="flex-1 py-2 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleTogglePublish(inv.id, inv.published)}
                    disabled={actionLoading === inv.id}
                    className="flex-1 py-2 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                  >
                    {inv.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => handleCopyLink(inv.slug)}
                    className="py-2 px-3 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {copied === inv.slug ? "Copied!" : "Copy Link"}
                  </button>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    disabled={actionLoading === inv.id}
                    className="py-2 px-3 text-xs font-medium text-red-400/70 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect, useCallback } from "react";

interface MessageData {
  id: string;
  content: string;
  senderName: string;
  createdAt: string;
  invitation: {
    id: string;
    title: string;
    slug: string;
  };
}

interface InvitationFilter {
  id: string;
  title: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [invitations, setInvitations] = useState<InvitationFilter[]>([]);
  const [selectedInvitation, setSelectedInvitation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedInvitation
        ? `/api/messages?invitationId=${selectedInvitation}`
        : "/api/messages";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [selectedInvitation]);

  useEffect(() => {
    fetch("/api/invitations", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setInvitations(
            data.map((inv: { id: string; title: string }) => ({
              id: inv.id,
              title: inv.title,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete message");
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Messages</h1>
          <p className="text-gray-400 mt-1">View and manage guest messages</p>
        </div>
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a3e] hover:bg-[#252550] border border-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          <svg
            className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <select
          value={selectedInvitation}
          onChange={(e) => setSelectedInvitation(e.target.value)}
          className="w-full sm:w-80 px-4 py-2.5 bg-[#1a1a3e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]"
        >
          <option value="">All Invitations</option>
          {invitations.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.title}
            </option>
          ))}
        </select>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-20 bg-[#1a1a3e] rounded-xl border border-gray-800">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-400 text-lg">No messages yet</p>
          <p className="text-gray-600 mt-1">Messages from guests will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-[#1a1a3e] rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#c9a96e]/10 flex items-center justify-center text-[#c9a96e] text-xs font-semibold shrink-0">
                      {msg.senderName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-semibold">{msg.senderName}</span>
                    <span className="inline-flex items-center px-2 py-0.5 bg-[#ed5566]/10 text-[#ed5566] text-xs rounded-full border border-[#ed5566]/20">
                      {msg.invitation.title}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap break-words pl-10">{msg.content}</p>
                  <p className="text-gray-500 text-sm mt-2 pl-10">{formatDate(msg.createdAt)}</p>
                </div>
                <button
                  onClick={() => handleDelete(msg.id)}
                  disabled={deletingId === msg.id}
                  className="flex-shrink-0 p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete message"
                >
                  {deletingId === msg.id ? (
                    <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

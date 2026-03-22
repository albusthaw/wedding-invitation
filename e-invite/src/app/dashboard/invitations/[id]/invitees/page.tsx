"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Invitee {
  id: string;
  name: string;
  specialCode: string;
  rsvpStatus: "PENDING" | "ACCEPTED" | "DECLINED";
  numberOfGuests: number;
  rsvpMessage: string | null;
  createdAt: string;
}

interface InvitationInfo {
  id: string;
  title: string;
  slug: string;
  groomName: string;
  brideName: string;
}

export default function InviteesPage() {
  const params = useParams();
  const id = params.id as string;

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/invitations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInvitation({
          id: data.id,
          title: data.title,
          slug: data.slug,
          groomName: data.groomName,
          brideName: data.brideName,
        });
        setInvitees(data.invitees || []);
      }
    } catch (e) {
      console.error("Failed to fetch", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const addInvitee = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/invitations/${id}/invitees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setNewName("");
        fetchData();
      }
    } catch (e) {
      console.error("Failed to add invitee", e);
    }
    setAdding(false);
  };

  const deleteInvitee = async (inviteeId: string) => {
    if (!confirm("Remove this invitee?")) return;
    await fetch(`/api/invitations/${id}/invitees/${inviteeId}`, {
      method: "DELETE",
    });
    fetchData();
  };

  const getSpecialLink = (invitee: Invitee) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/${invitation?.slug}?special=${invitee.specialCode}`;
  };

  const copyLink = (invitee: Invitee) => {
    navigator.clipboard.writeText(getSpecialLink(invitee));
    setCopied(invitee.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
            Accepted
          </span>
        );
      case "DECLINED":
        return (
          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
            Declined
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/invitations"
          className="text-[#c9a96e] text-sm hover:underline"
        >
          &larr; Back to Invitations
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Invitees - {invitation?.title}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {invitation?.groomName} & {invitation?.brideName} | /{invitation?.slug}
          </p>
        </div>
      </div>

      {/* Add Invitee Form */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter invitee name..."
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#c9a96e] text-sm"
            onKeyDown={(e) => e.key === "Enter" && addInvitee()}
          />
          <button
            onClick={addInvitee}
            disabled={adding || !newName.trim()}
            className="px-6 py-2 bg-[#ed5566] text-white rounded-lg text-sm hover:bg-[#d94455] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {adding ? "Adding..." : "Add Invitee"}
          </button>
        </div>
      </div>

      {/* Invitees List */}
      {invitees.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
          <p className="text-white/50">No invitees yet</p>
          <p className="text-white/30 text-sm mt-1">
            Add invitees above to generate special invitation links
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-3 text-white/50 text-xs uppercase">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-white/50 text-xs uppercase">
                    Special Link
                  </th>
                  <th className="text-left px-6 py-3 text-white/50 text-xs uppercase">
                    RSVP
                  </th>
                  <th className="text-left px-6 py-3 text-white/50 text-xs uppercase">
                    Guests
                  </th>
                  <th className="text-right px-6 py-3 text-white/50 text-xs uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invitees.map((invitee) => (
                  <tr
                    key={invitee.id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-6 py-3 text-white font-medium">
                      {invitee.name}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-white/40 text-xs truncate max-w-[200px]">
                          ?special={invitee.specialCode.substring(0, 20)}...
                        </code>
                        <button
                          onClick={() => copyLink(invitee)}
                          className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded hover:bg-white/20 cursor-pointer"
                        >
                          {copied === invitee.id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-3">{statusBadge(invitee.rsvpStatus)}</td>
                    <td className="px-6 py-3 text-white/70">
                      {invitee.numberOfGuests}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => deleteInvitee(invitee.id)}
                        className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 cursor-pointer"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {invitees.map((invitee) => (
              <div
                key={invitee.id}
                className="bg-white/5 rounded-xl border border-white/10 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-medium">{invitee.name}</h3>
                  {statusBadge(invitee.rsvpStatus)}
                </div>
                <p className="text-white/30 text-xs mb-3">
                  Guests: {invitee.numberOfGuests}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyLink(invitee)}
                    className="flex-1 py-2 bg-[#c9a96e]/20 text-[#c9a96e] text-xs rounded-lg cursor-pointer"
                  >
                    {copied === invitee.id ? "Copied!" : "Copy Special Link"}
                  </button>
                  <button
                    onClick={() => deleteInvitee(invitee.id)}
                    className="px-3 py-2 bg-red-500/20 text-red-400 text-xs rounded-lg cursor-pointer"
                  >
                    Remove
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

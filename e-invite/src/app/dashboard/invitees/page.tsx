"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Invitee {
  id: string;
  name: string;
  specialCode: string;
  invitationId: string;
  rsvpStatus: "PENDING" | "ACCEPTED" | "DECLINED";
  rsvpMessage: string | null;
  numberOfGuests: number;
  createdAt: string;
  invitation?: { slug: string };
}

interface Invitation {
  id: string;
  title: string;
  slug: string;
}

export default function InviteesPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedInvitation, setSelectedInvitation] = useState<string>("");
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch invitations
  useEffect(() => {
    fetch("/api/invitations", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setInvitations(list);
        if (list.length > 0 && !selectedInvitation) {
          setSelectedInvitation(list[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch invitees when invitation changes
  const fetchInvitees = useCallback(async () => {
    if (!selectedInvitation) return;
    try {
      const res = await fetch(`/api/invitees?invitationId=${selectedInvitation}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setInvitees(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
  }, [selectedInvitation]);

  useEffect(() => {
    fetchInvitees();
  }, [fetchInvitees]);

  const selectedSlug = invitations.find(i => i.id === selectedInvitation)?.slug || "";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  function getSpecialLink(invitee: Invitee) {
    const slug = invitee.invitation?.slug || selectedSlug;
    return `${baseUrl}/${slug}?special=${encodeURIComponent(invitee.specialCode)}`;
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }

  async function handleAddInvitee(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !selectedInvitation) return;
    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/invitees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), invitationId: selectedInvitation }),
      });
      if (res.ok) {
        setNewName("");
        setSuccess("Invitee added successfully!");
        setTimeout(() => setSuccess(""), 3000);
        fetchInvitees();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to add invitee");
      }
    } catch {
      setError("Failed to add invitee");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/invitees?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setInvitees((prev) => prev.filter((i) => i.id !== id));
        setDeleteConfirm(null);
      }
    } catch { /* ignore */ }
  }

  async function handleBulkImport() {
    if (!csvText.trim() || !selectedInvitation) return;
    setBulkLoading(true);
    setError("");

    // Parse CSV: support comma-separated or newline-separated names
    const names = csvText
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (names.length === 0) {
      setError("No valid names found in CSV");
      setBulkLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/invitees/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names, invitationId: selectedInvitation }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(`Imported ${data.created} invitees${data.errors > 0 ? ` (${data.errors} errors)` : ""}`);
        setTimeout(() => setSuccess(""), 5000);
        setCsvText("");
        setShowBulk(false);
        fetchInvitees();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Bulk import failed");
      }
    } catch {
      setError("Bulk import failed");
    } finally {
      setBulkLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function exportLinks() {
    if (invitees.length === 0) return;
    const csv = ["Name,RSVP Status,Guests,Link"];
    for (const inv of invitees) {
      csv.push(`"${inv.name}","${inv.rsvpStatus}","${inv.numberOfGuests}","${getSpecialLink(inv)}"`);
    }
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invitees-${selectedSlug || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = invitees.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const statusCounts = {
    total: invitees.length,
    accepted: invitees.filter((i) => i.rsvpStatus === "ACCEPTED").length,
    declined: invitees.filter((i) => i.rsvpStatus === "DECLINED").length,
    pending: invitees.filter((i) => i.rsvpStatus === "PENDING").length,
    totalGuests: invitees.filter(i => i.rsvpStatus === "ACCEPTED").reduce((sum, i) => sum + i.numberOfGuests, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-[#ed5566] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">Invitees</h1>
          <p className="text-white/50 mt-1 text-sm">Manage guest list and personalized invitation links</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulk(!showBulk)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            CSV Import
          </button>
          <button
            onClick={exportLinks}
            disabled={invitees.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-30"
          >
            Export Links
          </button>
        </div>
      </div>

      {/* Invitation selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white/70 mb-1.5">
          Select Invitation Letter
        </label>
        <select
          value={selectedInvitation}
          onChange={(e) => setSelectedInvitation(e.target.value)}
          className="w-full sm:w-auto px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#ed5566]/50 text-sm"
        >
          {invitations.length === 0 && <option value="">No invitations found</option>}
          {invitations.map((inv) => (
            <option key={inv.id} value={inv.id} className="bg-[#1a1a2e]">
              {inv.title}
            </option>
          ))}
        </select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-4 text-center">
          <p className="text-2xl font-bold text-white">{statusCounts.total}</p>
          <p className="text-xs text-white/40">Total</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-xl border border-emerald-500/20 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{statusCounts.accepted}</p>
          <p className="text-xs text-white/40">Accepted</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-xl border border-red-500/20 p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{statusCounts.declined}</p>
          <p className="text-xs text-white/40">Declined</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-xl border border-amber-500/20 p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{statusCounts.pending}</p>
          <p className="text-xs text-white/40">Pending</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-xl border border-[#c9a96e]/20 p-4 text-center">
          <p className="text-2xl font-bold text-[#c9a96e]">{statusCounts.totalGuests}</p>
          <p className="text-xs text-white/40">Est. Guests</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-red-400/60 hover:text-red-400">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          {success}
        </div>
      )}

      {/* Bulk CSV Import */}
      {showBulk && (
        <div className="mb-6 bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Bulk Import from CSV</h3>
          <p className="text-xs text-white/40 mb-3">
            Enter names separated by commas or newlines, or upload a CSV file with one name per line.
          </p>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-lg text-xs font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              Upload CSV File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"John Smith\nJane Doe\nBob Wilson"}
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ed5566]/50 resize-none font-mono"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => { setShowBulk(false); setCsvText(""); }}
              className="px-4 py-2 rounded-lg text-sm text-white/70 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkImport}
              disabled={bulkLoading || !csvText.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#ed5566] hover:bg-[#d9455a] transition-colors disabled:opacity-50"
            >
              {bulkLoading ? "Importing..." : "Import All"}
            </button>
          </div>
        </div>
      )}

      {/* Add single invitee */}
      <div className="mb-6 bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5">
        <form onSubmit={handleAddInvitee} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Add New Invitee
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter guest name"
              required
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#ed5566]/50 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !newName.trim() || !selectedInvitation}
            className="px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#ed5566] hover:bg-[#d9455a] transition-colors disabled:opacity-50 shrink-0"
          >
            {adding ? "Adding..." : "Add"}
          </button>
        </form>
      </div>

      {/* Search */}
      {invitees.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invitees..."
            className="w-full sm:w-64 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#ed5566]/50"
          />
        </div>
      )}

      {/* Invitees table */}
      {filtered.length === 0 && invitees.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/40 text-sm">No invitees yet. Add one above or import from CSV.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/40 text-sm">No invitees matching &quot;{search}&quot;</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2a4a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">RSVP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Guests</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">Link</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((invitee) => (
                  <tr key={invitee.id} className="border-b border-[#2a2a4a]/50 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="text-sm text-white font-medium">{invitee.name}</p>
                      {invitee.rsvpMessage && (
                        <p className="text-[11px] text-white/30 mt-0.5 truncate max-w-[200px]">{invitee.rsvpMessage}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        invitee.rsvpStatus === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-400" :
                        invitee.rsvpStatus === "DECLINED" ? "bg-red-500/10 text-red-400" :
                        "bg-amber-500/10 text-amber-400"
                      }`}>
                        {invitee.rsvpStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60">{invitee.numberOfGuests}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          copyToClipboard(getSpecialLink(invitee));
                          setSuccess(`Link copied for ${invitee.name}`);
                          setTimeout(() => setSuccess(""), 2000);
                        }}
                        className="text-[11px] text-[#c9a96e] hover:text-[#d4b87a] truncate max-w-[240px] block cursor-pointer"
                        title={getSpecialLink(invitee)}
                      >
                        Copy Link
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {deleteConfirm === invitee.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDelete(invitee.id)}
                            className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 rounded text-xs bg-white/5 text-white/50 hover:bg-white/10"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(invitee.id)}
                          className="text-white/30 hover:text-red-400 transition-colors p-1"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((invitee) => (
              <div key={invitee.id} className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-white font-medium">{invitee.name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                      invitee.rsvpStatus === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-400" :
                      invitee.rsvpStatus === "DECLINED" ? "bg-red-500/10 text-red-400" :
                      "bg-amber-500/10 text-amber-400"
                    }`}>
                      {invitee.rsvpStatus} ({invitee.numberOfGuests} guest{invitee.numberOfGuests !== 1 ? "s" : ""})
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (deleteConfirm === invitee.id) {
                        handleDelete(invitee.id);
                      } else {
                        setDeleteConfirm(invitee.id);
                        setTimeout(() => setDeleteConfirm(null), 3000);
                      }
                    }}
                    className={`text-xs px-2 py-1 rounded ${deleteConfirm === invitee.id ? "bg-red-500/20 text-red-400" : "text-white/30 hover:text-red-400"}`}
                  >
                    {deleteConfirm === invitee.id ? "Confirm?" : "Delete"}
                  </button>
                </div>
                {invitee.rsvpMessage && (
                  <p className="text-[11px] text-white/30 mb-2 truncate">{invitee.rsvpMessage}</p>
                )}
                <button
                  onClick={() => {
                    copyToClipboard(getSpecialLink(invitee));
                    setSuccess(`Link copied for ${invitee.name}`);
                    setTimeout(() => setSuccess(""), 2000);
                  }}
                  className="text-[11px] text-[#c9a96e] hover:text-[#d4b87a] cursor-pointer"
                >
                  Copy Personal Link
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

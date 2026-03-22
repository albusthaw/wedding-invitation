"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface InvitationOption {
  id: string;
  title: string;
  slug: string;
}

export default function NewUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "CLIENT">("CLIENT");
  const [selectedInvitations, setSelectedInvitations] = useState<string[]>([]);
  const [invitations, setInvitations] = useState<InvitationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    fetch("/api/invitations")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setInvitations(
            data.map((inv: { id: string; title: string; slug: string }) => ({
              id: inv.id,
              title: inv.title,
              slug: inv.slug,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          invitationIds: selectedInvitations,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create user");
      }

      router.push("/dashboard/users");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const toggleInvitation = (id: string) => {
    setSelectedInvitations((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/users"
          className="inline-flex items-center gap-1 text-gray-400 hover:text-[#c9a96e] text-sm mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Users
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Create New User</h1>
        <p className="text-gray-400 mt-1">Add a new user account to the system</p>
      </div>

      {serverError && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#1a1a3e] rounded-xl border border-gray-800 p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name <span className="text-[#ed5566]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2.5 bg-[#0f0f23] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 ${
                errors.name
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-700 focus:border-[#c9a96e] focus:ring-[#c9a96e]"
              }`}
              placeholder="John Doe"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address <span className="text-[#ed5566]">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2.5 bg-[#0f0f23] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 ${
                errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-700 focus:border-[#c9a96e] focus:ring-[#c9a96e]"
              }`}
              placeholder="john@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password <span className="text-[#ed5566]">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2.5 bg-[#0f0f23] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 ${
                errors.password
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-700 focus:border-[#c9a96e] focus:ring-[#c9a96e]"
              }`}
              placeholder="Minimum 6 characters"
            />
            {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password <span className="text-[#ed5566]">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2.5 bg-[#0f0f23] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 ${
                errors.confirmPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-700 focus:border-[#c9a96e] focus:ring-[#c9a96e]"
              }`}
              placeholder="Re-enter password"
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role <span className="text-[#ed5566]">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "ADMIN" | "CLIENT")}
              className="w-full px-4 py-2.5 bg-[#0f0f23] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]"
            >
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        {/* Assign Invitations */}
        <div className="bg-[#1a1a3e] rounded-xl border border-gray-800 p-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Assign Invitations</label>
          {invitations.length === 0 ? (
            <p className="text-gray-500 text-sm">No invitations available to assign</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {invitations.map((inv) => (
                <label
                  key={inv.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedInvitations.includes(inv.id)
                      ? "bg-[#c9a96e]/10 border border-[#c9a96e]/30"
                      : "bg-[#0f0f23] border border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedInvitations.includes(inv.id)}
                    onChange={() => toggleInvitation(inv.id)}
                    className="w-4 h-4 rounded border-gray-600 text-[#c9a96e] focus:ring-[#c9a96e] bg-[#0f0f23]"
                  />
                  <div>
                    <span className="text-white text-sm font-medium">{inv.title}</span>
                    <span className="text-gray-500 text-xs ml-2">/{inv.slug}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Link
            href="/dashboard/users"
            className="px-6 py-2.5 text-center text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold text-black bg-[#c9a96e] hover:bg-[#b8953d] rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}

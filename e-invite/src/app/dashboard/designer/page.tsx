"use client";

import { useState, useEffect } from "react";
import DesignerModal from "@/components/designer/DesignerModal";

interface InvitationItem {
  id: string;
  title: string;
  slug: string;
  groomName: string;
  brideName: string;
  published: boolean;
  needsRepublish: boolean;
  musicFile: string | null;
  galleryPhotos: string[];
  designConfig: Record<string, unknown>;
  updatedAt: string;
}

export default function DesignerPage() {
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [designing, setDesigning] = useState<InvitationItem | null>(null);

  const fetchInvitations = async () => {
    try {
      const res = await fetch("/api/invitations", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch (e) {
      console.error("Failed to fetch invitations", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handlePublish = async (id: string) => {
    await fetch(`/api/invitations/${id}/publish`, { method: "POST" });
    fetchInvitations();
  };

  const handleUnpublish = async (id: string) => {
    await fetch(`/api/invitations/${id}/unpublish`, { method: "POST" });
    fetchInvitations();
  };

  const handleSaveDesign = async (
    config: object,
    galleryPhotos: string[],
    musicFile: string | null
  ) => {
    if (!designing) return;
    await fetch(`/api/invitations/${designing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        designConfig: config,
        galleryPhotos,
        musicFile,
        needsRepublish: designing.published,
      }),
    });
    fetchInvitations();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Designer</h1>
          <p className="text-white/50 text-sm mt-1">
            AI-powered wedding page designer
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
          <p className="text-white/50 text-lg">No invitations yet</p>
          <p className="text-white/30 text-sm mt-2">
            Create an invitation first, then design it here
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider">
                    Invitation
                  </th>
                  <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider">
                    Couple
                  </th>
                  <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider">
                    Design Status
                  </th>
                  <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider">
                    Published
                  </th>
                  <th className="text-right px-6 py-4 text-white/50 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{inv.title}</p>
                      <p className="text-white/40 text-sm">/{inv.slug}</p>
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      {inv.groomName} & {inv.brideName}
                    </td>
                    <td className="px-6 py-4">
                      {inv.needsRepublish ? (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                          Needs Republish
                        </span>
                      ) : Object.keys(inv.designConfig || {}).length > 0 ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Designed
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-white/10 text-white/40 text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {inv.published ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-white/10 text-white/40 text-xs rounded-full">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDesigning(inv)}
                          className="px-4 py-2 bg-[#c9a96e] text-black text-sm rounded-lg hover:bg-[#b89a5e] transition-colors cursor-pointer"
                        >
                          Design
                        </button>
                        {inv.published ? (
                          <button
                            onClick={() => handleUnpublish(inv.id)}
                            className="px-3 py-2 bg-white/10 text-white/70 text-sm rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublish(inv.id)}
                            className="px-3 py-2 bg-[#ed5566] text-white text-sm rounded-lg hover:bg-[#d94455] transition-colors cursor-pointer"
                          >
                            Publish
                          </button>
                        )}
                        <a
                          href={`/${inv.slug}`}
                          target="_blank"
                          className="px-3 py-2 bg-white/10 text-white/70 text-sm rounded-lg hover:bg-white/20 transition-colors"
                        >
                          Preview
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="bg-white/5 rounded-xl border border-white/10 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-medium">{inv.title}</h3>
                    <p className="text-white/40 text-sm">
                      {inv.groomName} & {inv.brideName}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {inv.published ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Live
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-white/10 text-white/40 text-xs rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDesigning(inv)}
                    className="flex-1 py-2 bg-[#c9a96e] text-black text-sm rounded-lg cursor-pointer"
                  >
                    Design
                  </button>
                  {inv.published ? (
                    <button
                      onClick={() => handleUnpublish(inv.id)}
                      className="px-3 py-2 bg-white/10 text-white/70 text-sm rounded-lg cursor-pointer"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePublish(inv.id)}
                      className="px-3 py-2 bg-[#ed5566] text-white text-sm rounded-lg cursor-pointer"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Designer Modal */}
      {designing && (
        <DesignerModal
          invitation={{
            ...designing,
            galleryPhotos: Array.isArray(designing.galleryPhotos)
              ? designing.galleryPhotos
              : typeof designing.galleryPhotos === "string"
                ? (() => { try { const p = JSON.parse(designing.galleryPhotos); return Array.isArray(p) ? p : []; } catch { return []; } })()
                : [],
            designConfig: {
              primaryFont: "Great Vibes",
              backgroundColor: "#0d0505",
              primaryColor: "#ed5566",
              accentColor: "#c9a96e",
              textColor: "#ffffff",
              backgroundImage: "",
              enableGallery: true,
              enableRsvp: true,
              enableCountdown: true,
              enableMessages: true,
              customCss: "",
              ...(designing.designConfig as Record<string, unknown>),
            },
          }}
          onClose={() => {
            setDesigning(null);
            fetchInvitations();
          }}
          onSave={async (config, galleryPhotos, musicFile) => {
            await handleSaveDesign(config, galleryPhotos, musicFile);
          }}
          onPublish={async () => {
            await handlePublish(designing.id);
            fetchInvitations();
          }}
          onUnpublish={async () => {
            await handleUnpublish(designing.id);
            fetchInvitations();
          }}
        />
      )}
    </div>
  );
}

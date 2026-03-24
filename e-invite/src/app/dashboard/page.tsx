import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

async function getAdminStats() {
  const [totalInvitations, publishedInvitations, totalUsers, totalMessages, recentInvitations, recentMessages] = await Promise.all([
    prisma.invitationLetter.count(),
    prisma.invitationLetter.count({ where: { published: true } }),
    prisma.user.count(),
    prisma.message.count(),
    prisma.invitationLetter.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, groomName: true, brideName: true, published: true, createdAt: true } }),
    prisma.message.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { invitation: { select: { title: true } } } }),
  ]);
  return { totalInvitations, publishedInvitations, unpublishedInvitations: totalInvitations - publishedInvitations, totalUsers, totalMessages, recentInvitations, recentMessages };
}

async function getClientData(userId: string) {
  const assignments = await prisma.userInvitation.findMany({
    where: { userId },
    include: {
      invitation: {
        include: {
          _count: { select: { invitees: true, messages: true } },
        },
      },
    },
  });
  return assignments.map(a => a.invitation);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  if (isAdmin) {
    const stats = await getAdminStats();
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/50 mt-1 text-sm">Welcome back! Here is an overview of your wedding invitation system.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#ed5566]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#ed5566]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <Link href="/dashboard/invitations" className="text-[#ed5566] text-xs hover:underline">View all</Link>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalInvitations}</p>
            <p className="text-white/50 text-sm mt-1">Total Invitations</p>
            <div className="mt-3 flex gap-3 text-xs">
              <span className="text-green-400">{stats.publishedInvitations} published</span>
              <span className="text-yellow-400">{stats.unpublishedInvitations} draft</span>
            </div>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#c9a96e]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#c9a96e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
              </div>
              <Link href="/dashboard/users" className="text-[#c9a96e] text-xs hover:underline">View all</Link>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalUsers}</p>
            <p className="text-white/50 text-sm mt-1">Total Users</p>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <Link href="/dashboard/messages" className="text-purple-400 text-xs hover:underline">View all</Link>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalMessages}</p>
            <p className="text-white/50 text-sm mt-1">Total Messages</p>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalInvitations > 0 ? Math.round((stats.publishedInvitations / stats.totalInvitations) * 100) : 0}%</p>
            <p className="text-white/50 text-sm mt-1">Published Rate</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5 sm:p-6">
            <h2 className="font-serif text-lg font-semibold text-white mb-4">Recent Invitations</h2>
            {stats.recentInvitations.length === 0 ? (
              <p className="text-white/40 text-sm">No invitations yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentInvitations.map((inv: { id: string; title: string; groomName: string; brideName: string; published: boolean }) => (
                  <Link key={inv.id} href={`/dashboard/invitations/${inv.id}/edit`} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{inv.title}</p>
                      <p className="text-white/40 text-xs">{inv.groomName} & {inv.brideName}</p>
                    </div>
                    <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${inv.published ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                      {inv.published ? "Published" : "Draft"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5 sm:p-6">
            <h2 className="font-serif text-lg font-semibold text-white mb-4">Recent Messages</h2>
            {stats.recentMessages.length === 0 ? (
              <p className="text-white/40 text-sm">No messages yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentMessages.map((msg: { id: string; senderName: string; content: string; createdAt: Date; invitation: { title: string } }) => (
                  <div key={msg.id} className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-sm font-medium">{msg.senderName}</p>
                      <p className="text-white/30 text-xs">{new Date(msg.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-white/60 text-sm line-clamp-2">{msg.content}</p>
                    <p className="text-[#c9a96e] text-xs mt-1">{msg.invitation.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── CLIENT DASHBOARD ────────────────────────────────────────────────
  const invitations = await getClientData(session.user.id);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">My Invitations</h1>
        <p className="text-white/50 mt-1 text-sm">Welcome, {session.user.name}! Here are the invitations assigned to you.</p>
      </div>

      {invitations.length === 0 ? (
        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-12 text-center">
          <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          <p className="text-white/40 text-lg mb-2">No invitations assigned</p>
          <p className="text-white/30 text-sm">Contact an administrator to get assigned to an invitation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invitations.map((inv) => (
            <div key={inv.id} className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-6 hover:border-[#ed5566]/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-white font-semibold text-lg truncate">{inv.title}</h3>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${inv.published ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                  {inv.published ? "Published" : "Draft"}
                </span>
              </div>
              <p className="text-white/60 text-sm mb-1">{inv.groomName} & {inv.brideName}</p>
              <p className="text-white/40 text-xs mb-1">/{inv.slug}</p>
              <p className="text-white/40 text-xs mb-4">
                {new Date(inv.weddingDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              <div className="flex gap-3 text-xs text-white/40 mb-4">
                <span>{inv._count.invitees} invitees</span>
                <span>{inv._count.messages} messages</span>
              </div>
              <div className="flex gap-2">
                {inv.published && (
                  <a href={`/${inv.slug}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 text-center text-xs font-medium text-white/70 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    Preview
                  </a>
                )}
                <Link href={`/dashboard/invitees?invitationId=${inv.id}`} className="flex-1 py-2 text-center text-xs font-medium text-white bg-[#ed5566] hover:bg-[#d9455a] rounded-lg transition-colors">
                  Manage Invitees
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

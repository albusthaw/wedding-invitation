import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

async function getBrandName(): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "brandName" },
    });
    return setting?.value || "E-Invite";
  } catch {
    return "E-Invite";
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const brandName = await getBrandName();

  return (
    <div className="min-h-screen bg-[#0f0f23] flex flex-col lg:flex-row">
      <Sidebar brandName={brandName} />
      <main className="flex-1 mt-16 lg:mt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

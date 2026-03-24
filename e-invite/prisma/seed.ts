import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default admin user
  const adminPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@einvite.com" },
    update: {},
    create: {
      email: "admin@einvite.com",
      password: adminPassword,
      name: "Administrator",
      role: "ADMIN",
    },
  });

  console.log(`Admin user created/found: ${admin.email} (${admin.id})`);

  // Create default settings
  const defaultSettings: Record<string, string> = {
    brandName: "E-Invite",
    geminiImageModel: "gemini-3.1-flash-image-preview",
    geminiModel: "gemini-3.1-flash-lite-preview",
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
    console.log(`Setting "${key}" = "${value}"`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

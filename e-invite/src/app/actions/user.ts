"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  return session;
}

export async function createUser(formData: FormData) {
  await requireAdmin();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const role = (formData.get("role") as string) || "CLIENT";

  if (!email || !password || !name) {
    throw new Error("Missing required fields: email, password, and name are required");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role as "ADMIN" | "CLIENT",
    },
  });

  revalidatePath("/dashboard/users");
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function updateUser(id: string, formData: FormData) {
  await requireAdmin();

  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;
  const name = formData.get("name") as string | null;
  const role = formData.get("role") as string | null;

  const data: Record<string, unknown> = {};

  if (email) data.email = email;
  if (name) data.name = name;
  if (role) data.role = role;
  if (password && password.trim() !== "") {
    data.password = await bcrypt.hash(password, 12);
  }

  if (Object.keys(data).length === 0) {
    throw new Error("No fields to update");
  }

  const user = await prisma.user.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard/users");
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function deleteUser(id: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error("User not found");
  }

  await prisma.user.delete({ where: { id } });

  revalidatePath("/dashboard/users");
}

export async function getUsers() {
  await requireAdmin();

  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          invitations: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUser(id: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      invitations: {
        include: {
          invitation: {
            select: {
              id: true,
              title: true,
              slug: true,
              published: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

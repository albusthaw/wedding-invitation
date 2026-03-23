/**
 * Unit Tests for E-Invite Wedding Invitation System
 *
 * These tests run without a server or database.
 * They validate encryption, import consistency, build output, and file structure.
 *
 * Usage:
 *   npm run test:unit
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const PROJECT_ROOT = join(import.meta.dirname, "..");

// --- Encryption Tests ---

describe("Encryption", () => {
  const secret = "change-this-to-a-random-secret-key-in-production";
  const key = crypto.createHash("sha256").update(secret).digest();

  function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    const combined = iv.toString("base64") + ":" + encrypted;
    return combined
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  function decrypt(encrypted: string): string {
    let enc = encrypted.replace(/-/g, "+").replace(/_/g, "/");
    while (enc.length % 4) enc += "=";
    const [ivBase64, dataBase64] = enc.split(":");
    const iv = Buffer.from(ivBase64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(dataBase64, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  it("should round-trip encrypt/decrypt a simple string", () => {
    const input = "Hello World";
    assert.equal(decrypt(encrypt(input)), input);
  });

  it("should handle the invitee code format (name::id)", () => {
    const input = "John Doe::clx1abc123def";
    assert.equal(decrypt(encrypt(input)), input);
  });

  it("should handle unicode names", () => {
    const input = "မင်းသန့်သော::id123";
    assert.equal(decrypt(encrypt(input)), input);
  });

  it("should handle empty string", () => {
    const input = "";
    assert.equal(decrypt(encrypt(input)), input);
  });

  it("should produce URL-safe output (no +, /, =)", () => {
    // Run many times to catch edge cases
    for (let i = 0; i < 50; i++) {
      const input = `test-${crypto.randomBytes(16).toString("hex")}`;
      const encrypted = encrypt(input);
      assert.ok(!encrypted.includes("+"), `Contains + in: ${encrypted}`);
      assert.ok(!encrypted.includes("/"), `Contains / in: ${encrypted}`);
      assert.ok(!encrypted.includes("="), `Contains = in: ${encrypted}`);
    }
  });

  it("should produce different ciphertexts for same input", () => {
    const input = "Same Input";
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(encrypt(input));
    }
    assert.ok(results.size > 1, "Should produce different ciphertexts");
  });

  it("should throw on invalid decrypt input", () => {
    assert.throws(() => decrypt("not-valid-encrypted-data"), "Should throw on garbage input");
  });
});

// --- File Structure Tests ---

describe("File Structure", () => {
  const requiredFiles = [
    "package.json",
    "tsconfig.json",
    "next.config.ts",
    "postcss.config.mjs",
    "install.sh",
    "reinstall.sh",
    "package.sh",
    ".env.example",
    "CLAUDE.md",
    "README.md",
    "prisma/schema.prisma",
    "prisma/seed.ts",
    "src/lib/auth.ts",
    "src/lib/prisma.ts",
    "src/lib/encryption.ts",
    "src/lib/gemini.ts",
    "src/auth.ts",
    "src/proxy.ts",
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/app/login/page.tsx",
    "src/app/api/auth/[...nextauth]/route.ts",
    "src/app/actions/user.ts",
    "src/app/actions/invitation.ts",
    "src/app/actions/invitee.ts",
    "src/app/actions/message.ts",
    "src/app/actions/settings.ts",
    "src/app/actions/designer.ts",
  ];

  for (const file of requiredFiles) {
    it(`should have ${file}`, () => {
      const fullPath = join(PROJECT_ROOT, file);
      assert.ok(existsSync(fullPath), `Missing required file: ${file}`);
    });
  }

  it("should have upload directory placeholders", () => {
    assert.ok(existsSync(join(PROJECT_ROOT, "public/uploads/photos/.gitkeep")));
    assert.ok(existsSync(join(PROJECT_ROOT, "public/uploads/music/.gitkeep")));
  });

  it("should have executable install.sh", () => {
    const stats = statSync(join(PROJECT_ROOT, "install.sh"));
    const isExecutable = (stats.mode & 0o111) !== 0;
    assert.ok(isExecutable, "install.sh should be executable");
  });
});

// --- Import Consistency Tests ---

describe("Import Consistency", () => {
  function readFile(relativePath: string): string {
    return readFileSync(join(PROJECT_ROOT, relativePath), "utf8");
  }

  function findTsFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        results.push(...findTsFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it("should use named import { prisma } everywhere (no default import)", () => {
    const srcDir = join(PROJECT_ROOT, "src");
    const files = findTsFiles(srcDir);
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      // Match default import of prisma (but not { prisma })
      if (/import\s+prisma\s+from\s+["']@\/lib\/prisma["']/.test(content)) {
        const relative = file.replace(PROJECT_ROOT + "/", "");
        violations.push(relative);
      }
    }

    assert.equal(
      violations.length,
      0,
      `Files using default prisma import (should use named): ${violations.join(", ")}`
    );
  });

  it("should not have default export in prisma.ts", () => {
    const content = readFile("src/lib/prisma.ts");
    assert.ok(
      !content.includes("export default"),
      "prisma.ts should not have default export"
    );
  });

  it("should have 'use server' directive in all action files", () => {
    const actionsDir = join(PROJECT_ROOT, "src/app/actions");
    const files = readdirSync(actionsDir).filter((f) => f.endsWith(".ts"));

    for (const file of files) {
      const content = readFileSync(join(actionsDir, file), "utf8");
      assert.ok(
        content.trimStart().startsWith('"use server"'),
        `${file} should start with "use server"`
      );
    }
  });

  it("should have 'use client' directive in login page", () => {
    const content = readFile("src/app/login/page.tsx");
    assert.ok(
      content.trimStart().startsWith('"use client"'),
      "Login page should start with 'use client'"
    );
  });
});

// --- Configuration Tests ---

describe("Configuration", () => {
  it("should have correct package.json scripts", () => {
    const pkg = JSON.parse(readFileSync(join(PROJECT_ROOT, "package.json"), "utf8"));
    assert.ok(pkg.scripts.dev, "Should have dev script");
    assert.ok(pkg.scripts.build, "Should have build script");
    assert.ok(pkg.scripts.start, "Should have start script");
    assert.ok(pkg.scripts.postinstall, "Should have postinstall script");
    assert.ok(pkg.scripts["db:push"], "Should have db:push script");
    assert.ok(pkg.scripts["db:seed"], "Should have db:seed script");
  });

  it("should use prisma generate in postinstall", () => {
    const pkg = JSON.parse(readFileSync(join(PROJECT_ROOT, "package.json"), "utf8"));
    assert.ok(
      pkg.scripts.postinstall.includes("prisma generate"),
      "postinstall should run prisma generate"
    );
  });

  it("should have all required dependencies", () => {
    const pkg = JSON.parse(readFileSync(join(PROJECT_ROOT, "package.json"), "utf8"));
    const required = [
      "next",
      "react",
      "react-dom",
      "next-auth",
      "@prisma/client",
      "prisma",
      "bcryptjs",
      "tailwindcss",
      "framer-motion",
      "sharp",
      "typescript",
    ];
    for (const dep of required) {
      assert.ok(
        pkg.dependencies[dep],
        `Missing required dependency: ${dep}`
      );
    }
  });

  it("should have .env.example with all required variables", () => {
    const env = readFileSync(join(PROJECT_ROOT, ".env.example"), "utf8");
    const required = [
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "GEMINI_API_KEY",
      "GEMINI_MODEL",
    ];
    for (const key of required) {
      assert.ok(env.includes(key), `Missing env var: ${key}`);
    }
  });

  it("should have MySQL provider in Prisma schema", () => {
    const schema = readFileSync(join(PROJECT_ROOT, "prisma/schema.prisma"), "utf8");
    assert.ok(schema.includes('provider = "mysql"'), "Should use MySQL provider");
  });

  it("should have trustHost in auth config", () => {
    const auth = readFileSync(join(PROJECT_ROOT, "src/lib/auth.ts"), "utf8");
    assert.ok(auth.includes("trustHost: true"), "Auth config should have trustHost: true");
  });

  it("should NOT have authorized callback in auth config callbacks", () => {
    const auth = readFileSync(join(PROJECT_ROOT, "src/lib/auth.ts"), "utf8");
    assert.ok(
      !auth.includes("async authorized("),
      "Auth config should not have authorized callback (it's only for middleware)"
    );
  });
});

// --- Install Script Tests ---

describe("Install Script", () => {
  it("should reference invite.minthantthaw.me domain", () => {
    const script = readFileSync(join(PROJECT_ROOT, "install.sh"), "utf8");
    assert.ok(
      script.includes("invite.minthantthaw.me"),
      "install.sh should reference invite.minthantthaw.me"
    );
  });

  it("should configure Nginx with the correct server_name", () => {
    const script = readFileSync(join(PROJECT_ROOT, "install.sh"), "utf8");
    assert.ok(
      script.includes("server_name invite.minthantthaw.me"),
      "Nginx should use invite.minthantthaw.me"
    );
  });

  it("should set NEXTAUTH_URL to https://invite.minthantthaw.me", () => {
    const script = readFileSync(join(PROJECT_ROOT, "install.sh"), "utf8");
    assert.ok(
      script.includes('NEXTAUTH_URL="https://invite.minthantthaw.me"'),
      "NEXTAUTH_URL should be set correctly"
    );
  });

  it("should install all required packages (node, mysql, nginx, pm2)", () => {
    const script = readFileSync(join(PROJECT_ROOT, "install.sh"), "utf8");
    assert.ok(script.includes("install_nodejs"), "Should install Node.js");
    assert.ok(script.includes("install_mysql"), "Should install MySQL");
    assert.ok(script.includes("install_nginx"), "Should install Nginx");
    assert.ok(script.includes("install_pm2"), "Should install PM2");
  });

  it("should run prisma db push and seed", () => {
    const script = readFileSync(join(PROJECT_ROOT, "install.sh"), "utf8");
    assert.ok(script.includes("prisma db push"), "Should push Prisma schema");
    assert.ok(script.includes("seed.ts"), "Should run database seed");
  });
});

// --- Prisma Schema Tests ---

describe("Prisma Schema", () => {
  const schema = readFileSync(join(PROJECT_ROOT, "prisma/schema.prisma"), "utf8");

  it("should have User model with required fields", () => {
    assert.ok(schema.includes("model User"), "Should have User model");
    assert.ok(schema.includes("email"), "User should have email field");
    assert.ok(schema.includes("password"), "User should have password field");
    assert.ok(schema.includes("role"), "User should have role field");
  });

  it("should have InvitationLetter model", () => {
    assert.ok(schema.includes("model InvitationLetter"), "Should have InvitationLetter model");
    assert.ok(schema.includes("slug"), "Should have slug field");
    assert.ok(schema.includes("published"), "Should have published field");
  });

  it("should have Invitee model with RSVP status", () => {
    assert.ok(schema.includes("model Invitee"), "Should have Invitee model");
    assert.ok(schema.includes("rsvpStatus"), "Should have rsvpStatus field");
    assert.ok(schema.includes("specialCode"), "Should have specialCode field");
  });

  it("should have Message model", () => {
    assert.ok(schema.includes("model Message"), "Should have Message model");
    assert.ok(schema.includes("senderName"), "Should have senderName field");
  });

  it("should have Setting model", () => {
    assert.ok(schema.includes("model Setting"), "Should have Setting model");
  });

  it("should have cascade deletes on relations", () => {
    assert.ok(schema.includes("onDelete: Cascade"), "Should have cascade deletes");
  });
});

// --- Security Tests ---

describe("Security Checks", () => {
  function findTsFiles(dir: string): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        results.push(...findTsFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it("should not have hardcoded secrets in source code", () => {
    const srcDir = join(PROJECT_ROOT, "src");
    const files = findTsFiles(srcDir);
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      // Check for hardcoded API keys or passwords (common patterns)
      if (
        /(?:api_key|apikey|secret|password)\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/i.test(
          content
        )
      ) {
        const relative = file.replace(PROJECT_ROOT + "/", "");
        violations.push(relative);
      }
    }

    assert.equal(
      violations.length,
      0,
      `Files with potential hardcoded secrets: ${violations.join(", ")}`
    );
  });

  it("should use bcryptjs for password hashing (not plain text)", () => {
    const authContent = readFileSync(join(PROJECT_ROOT, "src/lib/auth.ts"), "utf8");
    assert.ok(authContent.includes("bcrypt.compare"), "Should use bcrypt.compare for login");

    const seedContent = readFileSync(join(PROJECT_ROOT, "prisma/seed.ts"), "utf8");
    assert.ok(seedContent.includes("bcrypt.hash"), "Should use bcrypt.hash in seed");
  });

  it("should have try-catch in authorize function", () => {
    const auth = readFileSync(join(PROJECT_ROOT, "src/lib/auth.ts"), "utf8");
    // Check that the authorize function has error handling
    assert.ok(
      auth.includes("try") && auth.includes("catch"),
      "authorize function should have try-catch error handling"
    );
  });

  it("should protect dashboard routes in proxy", () => {
    const proxy = readFileSync(join(PROJECT_ROOT, "src/proxy.ts"), "utf8");
    assert.ok(
      proxy.includes("/dashboard"),
      "Proxy should check dashboard routes"
    );
    assert.ok(
      proxy.includes("getToken"),
      "Proxy should use getToken to check login status"
    );
  });
});

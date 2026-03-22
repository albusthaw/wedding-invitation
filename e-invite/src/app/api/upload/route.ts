import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3"];
const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES];

const MAX_IMAGE_WIDTH = 2000;
const TWO_MB = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Allowed types: jpg, png, webp, mp3`,
        },
        { status: 400 }
      );
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type);

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() || (isImage ? "jpg" : "mp3");
    const fileName = `${crypto.randomUUID()}.${ext}`;

    if (isImage) {
      const uploadDir = join(process.cwd(), "public", "uploads", "photos");
      await mkdir(uploadDir, { recursive: true });

      let processedBuffer: Uint8Array = buffer;

      // Get image metadata to check dimensions
      const metadata = await sharp(buffer).metadata();
      const needsResize =
        metadata.width && metadata.width > MAX_IMAGE_WIDTH;
      const needsCompress = buffer.length > TWO_MB;

      if (needsResize || needsCompress) {
        let sharpInstance = sharp(buffer);

        if (needsResize) {
          sharpInstance = sharpInstance.resize(MAX_IMAGE_WIDTH, undefined, {
            fit: "inside",
            withoutEnlargement: true,
          });
        }

        const quality = needsCompress ? 70 : 85;

        if (ext === "png") {
          processedBuffer = await sharpInstance
            .png({ quality })
            .toBuffer();
        } else if (ext === "webp") {
          processedBuffer = await sharpInstance
            .webp({ quality })
            .toBuffer();
        } else {
          processedBuffer = await sharpInstance
            .jpeg({ quality })
            .toBuffer();
        }
      }

      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, processedBuffer);

      return NextResponse.json({
        success: true,
        path: `/uploads/photos/${fileName}`,
        size: processedBuffer.length,
        originalSize: buffer.length,
      });
    }

    if (isAudio) {
      const uploadDir = join(process.cwd(), "public", "uploads", "music");
      await mkdir(uploadDir, { recursive: true });

      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        path: `/uploads/music/${fileName}`,
        size: buffer.length,
      });
    }

    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

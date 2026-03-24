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
const MAX_IMAGE_HEIGHT = 2000;
const TWO_MB = 2 * 1024 * 1024;
const RECOMMENDED_MAX_KB = 500;

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
    // Derive extension from MIME type, NOT user filename (prevents .svg/.html injection)
    const MIME_TO_EXT: Record<string, string> = {
      "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp",
      "audio/mpeg": "mp3", "audio/mp3": "mp3",
    };
    const ext = MIME_TO_EXT[file.type] || (isImage ? "jpg" : "mp3");
    const fileName = `${crypto.randomUUID()}.${ext}`;

    if (isImage) {
      const uploadDir = join(process.cwd(), "public", "uploads", "photos");
      await mkdir(uploadDir, { recursive: true });

      let processedBuffer: Uint8Array = buffer;

      // Get image metadata to check dimensions
      const metadata = await sharp(buffer).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;
      const needsResize =
        originalWidth > MAX_IMAGE_WIDTH || originalHeight > MAX_IMAGE_HEIGHT;
      const needsCompress = buffer.length > TWO_MB;
      const wasOversized = needsResize || needsCompress;

      if (needsResize || needsCompress) {
        let sharpInstance = sharp(buffer);

        if (needsResize) {
          sharpInstance = sharpInstance.resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
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

      const url = `/uploads/photos/${fileName}`;
      const finalSizeKB = Math.round(processedBuffer.length / 1024);

      // Build AI optimization suggestion if the photo was oversized
      let aiSuggestion: string | null = null;
      if (wasOversized) {
        const originalSizeKB = Math.round(buffer.length / 1024);
        aiSuggestion = `Photo was automatically optimized: ${originalWidth}x${originalHeight} (${originalSizeKB}KB) → resized/compressed to ${finalSizeKB}KB. ` +
          `For best results, upload photos under ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}px and ${TWO_MB / 1024}KB. ` +
          `Use the AI Designer to request further image adjustments like cropping or style changes.`;
      }

      return NextResponse.json({
        success: true,
        url,
        path: url,
        size: processedBuffer.length,
        originalSize: buffer.length,
        originalDimensions: { width: originalWidth, height: originalHeight },
        wasOptimized: wasOversized,
        aiSuggestion,
      });
    }

    if (isAudio) {
      const uploadDir = join(process.cwd(), "public", "uploads", "music");
      await mkdir(uploadDir, { recursive: true });

      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      const url = `/uploads/music/${fileName}`;

      return NextResponse.json({
        success: true,
        url,
        path: url,
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

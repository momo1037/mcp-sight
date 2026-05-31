import { describe, it, expect } from "bun:test";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { readFileSync } from "node:fs";
import { extname } from "node:path";

// ─── Test image path ──────────────────────────────────────────────

const TEST_IMAGE = new URL("../fixtures/test-image.png", import.meta.url).pathname;
// Windows drive letter normalization
const TEST_IMAGE_PATH = TEST_IMAGE.replace(/^\/([a-zA-Z]):\//, "$1:/");

// ─── OpenAI client (reads from .env via bun auto-load) ──────────

const openai = createOpenAI({
  apiKey: process.env.VISION_API_KEY!,
  baseURL: process.env.VISION_BASE_URL || "https://api.openai.com/v1",
});
const model = process.env.VISION_MODEL || "mimo-v2.5";

// ─── Helpers ──────────────────────────────────────────────────────

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
  ".svg": "image/svg+xml", ".tiff": "image/tiff", ".tif": "image/tiff",
  ".ico": "image/x-icon", ".heic": "image/heic", ".heif": "image/heif",
};

function getMediaType(filePath: string): string | null {
  const ext = extname(filePath).toLowerCase();
  return MIME_MAP[ext] || null;
}

function loadTestImage(): { buffer: Buffer; mediaType: string } {
  const buffer = readFileSync(TEST_IMAGE_PATH);
  const mediaType = getMediaType(TEST_IMAGE_PATH);
  if (!mediaType) throw new Error(`Unknown media type for ${TEST_IMAGE_PATH}`);
  return { buffer, mediaType };
}

async function describeImage(prompt: string, system?: string): Promise<string> {
  const { buffer, mediaType } = loadTestImage();
  const result = await generateText({
    model: openai.chat(model),
    system,
    messages: [
      { role: "user" as const, content: [
        { type: "text" as const, text: prompt },
        { type: "image" as const, image: buffer, mediaType },
      ]},
    ],
  });
  return result.text;
}

// ─── Tests ────────────────────────────────────────────────────────

describe("see_image", () => {
  it("describes the test image with default prompt", { timeout: 30000 }, async () => {
    const result = await describeImage("Describe this image in detail.");

    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(20);
  });

  it("returns concise output with brief detail level", { timeout: 30000 }, async () => {
    const brief = await describeImage(
      "Describe this image.",
      "You are a concise image describer. Reply in 1-2 short sentences. Be direct and brief.",
    );

    expect(brief).toBeTruthy();
    expect(brief.length).toBeLessThan(300);
  });

  it("responds to a specific question about the image", { timeout: 30000 }, async () => {
    const result = await describeImage(
      "What color is the creature in this image? Answer in one word.",
    );

    // Color perception varies — accept any reasonable color word
    expect(result.toLowerCase()).toMatch(/orange|salmon|peach|brown|tan|beige/);
  });

  it("detects the pixel art style", { timeout: 30000 }, async () => {
    const result = await describeImage(
      "What art style is this image? Answer briefly.",
    );

    expect(result.toLowerCase()).toMatch(/pixel|8-bit|retro|blocky/);
  });

  it("returns error for non-existent file", () => {
    expect(() => readFileSync("C:/nonexistent/path/image.png")).toThrow();
  });

  it("detects unknown MIME type as null", () => {
    expect(getMediaType("file.xyz")).toBeNull();
  });

  it("detects correct MIME types from extensions", () => {
    expect(getMediaType("photo.png")).toBe("image/png");
    expect(getMediaType("photo.jpg")).toBe("image/jpeg");
    expect(getMediaType("photo.jpeg")).toBe("image/jpeg");
    expect(getMediaType("photo.webp")).toBe("image/webp");
  });

  it("test image is a valid PNG", () => {
    const { buffer, mediaType } = loadTestImage();
    expect(mediaType).toBe("image/png");
    expect(buffer.length).toBeGreaterThan(0);
  });
});

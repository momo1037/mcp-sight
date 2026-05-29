import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { readFileSync } from "node:fs";
import { extname } from "node:path";

// ─── Configuration from environment ───────────────────────────────

const VISION_API_KEY = process.env.VISION_API_KEY;
const VISION_BASE_URL =
  process.env.VISION_BASE_URL || "https://api.openai.com/v1";
const VISION_MODEL = process.env.VISION_MODEL || "mimo-v2.5";

if (!VISION_API_KEY) {
  console.error("ERROR: VISION_API_KEY environment variable is required");
  process.exit(1);
}

// ─── Media type detection ──────────────────────────────────────────

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
  ".ico": "image/x-icon",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

function getMediaType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_MAP[ext] || "image/png";
}

// ─── Detail-level prompts ──────────────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {
  brief:
    "You are a concise image describer. Reply in 1-2 short sentences. " +
    "Focus only on the most important subject and action in the image. " +
    "Be direct and brief.",

  standard:
    "You are a helpful image describer. Describe the image in detail — " +
    "cover main subjects, composition, colors, setting, and any notable elements. " +
    "Be thorough but focused. Do not add interpretation beyond what is visible.",

  detailed:
    "You are an expert visual analyst. Provide an extremely thorough, " +
    "comprehensive description. Cover: main subjects, background, composition, " +
    "lighting/contrast, colors/palette, textures, mood/atmosphere, " +
    "spatial relationships, any text visible (transcribe exactly), " +
    "and subtle details that might be overlooked. Be exhaustive.",
};

// ─── OpenAI client ─────────────────────────────────────────────────

const openai = createOpenAI({
  apiKey: VISION_API_KEY,
  baseURL: VISION_BASE_URL,
});

// ─── MCP Server ────────────────────────────────────────────────────

const server = new McpServer({
  name: "mcp-sight",
  version: "1.0.0",
});

server.tool(
  "describe_image",
  "Describe an image file using a vision-capable large language model. " +
    "Provide the absolute path to an image file on disk, and optionally a " +
    "specific question or context to guide the description.",
  {
    image_path: z.string().describe(
      "Absolute path to the image file to describe (e.g. C:/Users/Admin/pic.png)"
    ),
    prompt: z
      .string()
      .optional()
      .describe(
        "Specific question or instruction for the vision model. " +
          'Defaults to "Describe this image in detail."'
      ),
    context: z
      .string()
      .optional()
      .describe(
        "User's original question or background context. " +
          "This helps the model understand what the user is ultimately trying to accomplish."
      ),
    detail_level: z
      .enum(["brief", "standard", "detailed"])
      .optional()
      .describe(
        "Level of detail in the description. " +
          "'brief' = 1-2 sentences, " +
          "'standard' = thorough description, " +
          "'detailed' = exhaustive visual analysis. " +
          "Defaults to 'standard'."
      ),
  },
  async ({ image_path, prompt, context, detail_level }) => {
    // 1. Read image file
    let buffer: Buffer;
    let mediaType: string;
    try {
      buffer = readFileSync(image_path);
      mediaType = getMediaType(image_path);
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to read image file at "${image_path}": ${err.message}`,
          },
        ],
        isError: true,
      };
    }

    // 2. Construct prompts
    const level = detail_level || "standard";
    const systemPrompt = SYSTEM_PROMPTS[level];

    let userPrompt = prompt || "Describe this image in detail.";
    if (context) {
      userPrompt = [
        "Background context (the user is asking about this):",
        context,
        "",
        "Specific request:",
        userPrompt,
      ].join("\n");
    }

    // 3. Call vision model
    try {
      const result = await generateText({
        model: openai.chat(VISION_MODEL),
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image", image: buffer, mediaType },
            ],
          },
        ],
      });

      return {
        content: [{ type: "text", text: result.text }],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `Vision model API error: ${err.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── Start ─────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`mcp-sight ready (model: ${VISION_MODEL}, base: ${VISION_BASE_URL})`);
}

main().catch((err) => {
  console.error("Fatal error starting mcp-vision:", err);
  process.exit(1);
});

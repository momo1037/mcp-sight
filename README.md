# mcp-sight

Give Claude Code the power of sight — describe images using any vision-capable LLM (OpenAI-compatible API).

## Setup

Add to `~/.claude/settings.json` or `<project>/.claude/settings.json`:

```json
{
  "mcpServers": {
    "mcp-sight": {
      "command": "bunx",
      "args": ["--bun", "mcp-sight"],
      "env": {
        "VISION_API_KEY": "sk-your-api-key",
        "VISION_BASE_URL": "https://api.openai.com/v1",
        "VISION_MODEL": "gpt-4o"
      }
    }
  }
}
```

Or use the `claude mcp add` command:

```bash
claude mcp add mcp-sight \
  --scope user \
  --env VISION_API_KEY=sk-your-api-key \
  --env VISION_BASE_URL=https://api.openai.com/v1 \
  --env VISION_MODEL=gpt-4o \
  -- bunx --bun mcp-sight
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VISION_API_KEY` | **Yes** | — | API key for the vision provider |
| `VISION_BASE_URL` | No | `https://api.openai.com/v1` | OpenAI-compatible API base URL |
| `VISION_MODEL` | No | `mimo-v2.5` | Model ID for vision requests |

## Tool: `describe_image`

When you send an image to Claude Code, it can call this tool to "see" it.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `image_path` | string | Yes | Absolute path to the image file |
| `prompt` | string | No | What to focus on in the image |
| `context` | string | No | Background context from your conversation |
| `detail_level` | `"brief"` \| `"standard"` \| `"detailed"` | No | How much detail (default: `"standard"`) |

## Supported Image Formats

JPEG, PNG, GIF, WebP, BMP, SVG, TIFF, ICO, HEIC, HEIF

## License

MIT

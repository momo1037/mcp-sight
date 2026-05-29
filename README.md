# mcp-vision

MCP server that lets Claude Code (and other MCP hosts) describe images using a vision-capable LLM (OpenAI-compatible API).

## Installation

```bash
npm install -g mcp-vision
# or
bun add -g mcp-vision
```

## Configuration

Set these environment variables when launching the server:

| Variable | Required | Default | Description |
|---|---|---|---|
| `VISION_API_KEY` | **Yes** | — | API key for the vision provider |
| `VISION_BASE_URL` | No | `https://api.openai.com/v1` | OpenAI-compatible API base URL |
| `VISION_MODEL` | No | `mimo-v2.5` | Model ID for vision requests |

## Claude Code Setup

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "mcp-vision": {
      "command": "bun",
      "args": ["run", "C:/Dev/mcp-vision/src/index.ts"],
      "env": {
        "VISION_API_KEY": "sk-your-api-key",
        "VISION_BASE_URL": "https://api.example.com/v1",
        "VISION_MODEL": "mimo-v2.5"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "mcp-vision": {
      "command": "bunx",
      "args": ["mcp-vision"],
      "env": {
        "VISION_API_KEY": "sk-your-api-key",
        "VISION_BASE_URL": "https://api.example.com/v1",
        "VISION_MODEL": "mimo-v2.5"
      }
    }
  }
}
```

## Tool: `describe_image`

| Parameter | Type | Required | Description |
|---|---|---|---|
| `image_path` | string | Yes | Absolute path to the image file |
| `prompt` | string | No | Specific question or instruction about the image |
| `context` | string | No | User's original question or background context |
| `detail_level` | `"brief"` \| `"standard"` \| `"detailed"` | No | Level of detail (default: `"standard"`) |

## Supported Image Formats

JPEG, PNG, GIF, WebP, BMP, SVG, TIFF, ICO, HEIC, HEIF

## License

MIT

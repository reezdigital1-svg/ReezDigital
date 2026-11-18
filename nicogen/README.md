# Nico Gen Studio

A fully self-owned prompt-to-video generation system. No external model APIs, no keys, no metering. The machine renders the video itself.

## Contents
- engine.py: the generation core. Prompt in, cinematic MP4 out. Four styles (cinematic, neon, minimal, noir), procedural scene kinds (horizon, orb, grid, starfield, kinetic typography), camera moves (push, drift, orbit), film pass (grain, vignette, letterbox, flare), title/end cards.
- upload_verify.py: delivery helper (upload + end-to-end verification of the export link).
- server.py (next step): the REST API surface: POST /api/generate, GET /api/status/{job}, GET /api/video/{job}. Run it on your own machine; render capacity is local, nothing blocked.
- studio/ (next step): the web front end: prompt box, style picker, duration slider, live progress, result player. Hosted on Vercel, pointed at your local engine API.

## Usage
python engine.py --prompt "your shot description, scene two, scene three" --style neon --duration 9 --out demo.mp4

Requirements: Python 3, Pillow, imageio-ffmpeg (cross-platform).

## Zero-API delivery design
Uses the same transport-verified delivery pipeline as all shipped videos: verify status 200, content-type, byte count, and the MP4 ftyp header before a link is ever handed out.

## MCP server (mcp_server.py)

Exposes the engine as MCP tools over stdio: generate_video, list_styles, verify_export.

Connect in Claude Desktop (Developer settings, Edit Config, claude_desktop_config.json):

```json
{
  "mcpServers": {
    "nico-gen-studio": {
      "command": "python3",
      "args": ["PATH/TO/nicogen/mcp_server.py"]
    }
  }
}
```

Then any chat can ask: generate a video with the Nico Gen Studio tool. Rendering is 100% local, no APIs. The verify_export tool enforces the delivery rule: status, content-type, byte count, and MP4 header checked before any link is trusted.

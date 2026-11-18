#!/usr/bin/env python3
"""
Nico Gen Studio MCP Server: exposes the self-owned video generation engine
as MCP tools over stdio (newline-delimited JSON-RPC 2.0), so any MCP client
(Claude Desktop, ring agents, or any MCP host) can generate video locally.

Tools:
  generate_video  {prompt, style?, duration?, fps?, size?, out?} -> MP4 path + bytes
  list_styles     {} -> available styles and their palettes
  verify_export   {url, expected_bytes?} -> end-to-end link verification

Transport: MCP stdio. Each request is one JSON object on its own line.
Run:  python3 mcp_server.py        (long-running; wire it into your client config)
"""
import json, subprocess, sys, os, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(HERE, "engine.py")
PYTHON = sys.executable or "python3"

TOOLS = [
    {
        "name": "generate_video",
        "description": "Generate a cinematic video from a text prompt with the Nico Gen Studio engine. Self-rendered: no external APIs. Returns the MP4 file path and size.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string", "description": "Shot description; comma-separate phrases to cut between scenes"},
                "style": {"type": "string", "enum": ["cinematic", "neon", "minimal", "noir"], "description": "Visual style preset"},
                "duration": {"type": "number", "description": "Seconds, 1 to 30 (default 8)"},
                "fps": {"type": "number", "description": "Frames per second (default 30)"},
                "size": {"type": "string", "description": "Output size, e.g. 1920x1080 (default)"},
                "out": {"type": "string", "description": "Output mp4 path"},
            },
            "required": ["prompt"],
        },
    },
    {
        "name": "list_styles",
        "description": "List the available visual styles of the Nico Gen Studio engine.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "verify_export",
        "description": "Verify a delivery link end to end: HTTP status, content type, byte count, and MP4 header. Never trust an unverified link.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "url": {"type": "string"},
                "expected_bytes": {"type": "integer", "description": "Optional exact byte count to enforce"},
            },
            "required": ["url"],
        },
    },
]

def result(id_, value):
    print(json.dumps({"jsonrpc": "2.0", "id": id_, "result": value}), flush=True)

def error(id_, code, message):
    print(json.dumps({"jsonrpc": "2.0", "id": id_, "error": {"code": code, "message": message}}), flush=True)

def tool_generate(args):
    prompt = str(args.get("prompt", "")).strip()
    if not prompt:
        raise ValueError("prompt is required")
    style = args.get("style", "cinematic")
    duration = float(args.get("duration", 8))
    duration = max(1.0, min(30.0, duration))
    fps = int(args.get("fps", 30))
    size = str(args.get("size", "1920x1080"))
    out = str(args.get("out") or f"/tmp/nicogen_{int(time.time())}.mp4")
    cmd = [PYTHON, ENGINE, "--prompt", prompt, "--style", style,
           "--duration", str(duration), "--fps", str(fps), "--size", size, "--out", out]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
    if proc.returncode != 0:
        raise RuntimeError(f"engine failed: {proc.stderr[-500:]}")
    return {"video_path": out, "bytes": os.path.getsize(out), "style": style,
            "duration_s": duration, "size": size, "log_tail": proc.stdout.strip().splitlines()[-1:]}

def tool_verify(args):
    url = args["url"]
    req = urllib.request.Request(url, headers={"User-Agent": "NicoGenMCP/1.0"})
    r = urllib.request.urlopen(req, timeout=120)
    blob = r.read()
    expected = args.get("expected_bytes")
    return {
        "url": url, "status": r.status, "content_type": r.headers.get("Content-Type"),
        "bytes": len(blob), "mp4_header_ok": blob[:4] == b"\x00\x00\x00 ftyp" or b"ftyp" in blob[:12],
        "exact_bytes_ok": (expected is None or len(blob) == expected),
    }

def tool_styles():
    sys.path.insert(0, HERE)
    from engine import STYLES
    return {name: {"bg": s["bg"], "accent": s["accent"], "accent2": s["accent2"]} for name, s in STYLES.items()}

def handle(msg):
    if not isinstance(msg, dict):
        error(None, -32600, "Invalid Request"); return
    method = msg.get("method"); id_ = msg.get("id"); params = msg.get("params") or {}
    if method == "initialize":
        result(id_, {
            "protocolVersion": params.get("protocolVersion", "2024-11-05"),
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "nico-gen-studio", "version": "1.0.0"},
        })
    elif method in ("notifications/initialized", "notifications/cancelled"):
        pass  # no response for notifications
    elif method == "ping":
        result(id_, {})
    elif method == "tools/list":
        result(id_, {"tools": TOOLS})
    elif method == "tools/call":
        name = params.get("name"); args = params.get("arguments") or {}
        try:
            if name == "generate_video": value = tool_generate(args)
            elif name == "list_styles": value = tool_styles()
            elif name == "verify_export": value = tool_verify(args)
            else: raise ValueError(f"unknown tool {name}")
            result(id_, {"content": [{"type": "text", "text": json.dumps(value)}], "isError": False})
        except Exception as e:
            result(id_, {"content": [{"type": "text", "text": str(e)}], "isError": True})
    else:
        if id_ is not None:
            error(id_, -32601, f"Method not found: {method}")

def main():
    for line in sys.stdin:
        line = line.strip()
        if not line: continue
        try:
            handle(json.loads(line))
        except json.JSONDecodeError:
            error(None, -32700, "Parse error")
        except Exception as e:
            error(None, -32603, f"Internal error: {e}")

if __name__ == "__main__":
    main()

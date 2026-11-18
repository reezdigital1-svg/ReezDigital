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

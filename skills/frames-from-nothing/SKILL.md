---
name: frames-from-nothing
description: >
  Render studio-grade motion graphics video from pure code with no browser,
  no After Effects, no stock footage, and no rendering farm. Use when the
  user wants a 3D or 2D motion graphics video, logo sting, kinetic typography
  piece, product showcase, or explainer built entirely in code, especially in
  restricted environments where headless browsers cannot run.
---

# Frames From Nothing

Every frame computed, nothing downloaded. This skill renders motion graphics
with a software 3D engine written in Python: real polygon meshes, perspective
projection, depth sorting, shading, and camera moves. It needs only Python,
Pillow, numpy, and FFmpeg. It works where Playwright, After Effects, and
stock libraries are unavailable.

## Why this exists

Browser-based video engines fail in locked-down sandboxes. Template files
need paid software. Stock footage needs licenses. This skill removes every
external dependency: geometry, typography, lighting, and sound are all
generated in code, so the output is fully owned and license-clean.

## The engine concepts

### 3D core
- Meshes as vertex arrays and quad or triangle faces.
- Rotation matrices (yaw, pitch), perspective projection:
  sx = cx + f*x/z, sy = cy - f*y/z.
- Painter's algorithm: sort faces by mean depth, draw far to near.
- Lambert diffuse plus rim light for shape readability; hue shift by surface
  normal for an iridescent look.
- Parametric meshes from math: torus knots, tubes, spheres, grids, tunnels.

### Extruded 3D typography
- Render each letter once as an RGBA sprite.
- Place letters at 3D positions; project each depth layer separately and draw
  back to front with darkened copies. This gives true perspective extrusion
  (stacks converge toward the vanishing point) without mesh generation.

### Textured quads
- For screens, cards, and panels: pre-render content offscreen, then map it
  onto a projected quad with a perspective transform (8-coefficient solve).
- Draw a dark blurred backing behind floating panels so they separate from
  busy backgrounds.

### Sound design, synthesized
- Whoosh: lowpassed noise with a sine-squared envelope, on scene changes.
- Boom: decaying low-frequency sine for openings.
- Tick: short 2 kHz blips under count-ups, every 0.13 seconds.
- Click, chime, riser: for presses, reveals, and build-ups.
- Mix at 44.1 kHz, 16-bit WAV; land sounds about 3 frames before the visual.

## The workflow

### 1. Design the timeline first
Write the scene table before any code: time ranges, what each scene proves,
and which narration line it supports. Keep scenes 4 to 6 seconds. Overlap
scene edges by about 0.3 seconds for crossfades.

### 2. Preview before committing (mandatory)
Render 6 to 9 still frames at scene midpoints. Inspect them for overlaps,
cut-off text, broken perspective, and empty areas. Fix everything at preview
speed. Never discover layout bugs in a full render.

### 3. Render frames
One PNG per frame at 30 fps. Precompute static backgrounds with numpy grids
and vignettes. Keep per-frame work to overlays only.

### 4. Encode
- Normalize every scene input: fps=30, setsar=1 before concat or xfade.
- Audio: voiceover, music bed at low volume with fades, SFX layer, mixed with
  amix normalize=0, then loudnorm I=-14:TP=-1.5:LRA=11 and a limiter.
- Force stereo output (pan mono sources), aac 192k, H.264 crf 17, yuv420p,
  +faststart.

### 5. Verify
ffprobe duration and streams, ebur128 loudness, extract 5 frames across the
timeline and inspect them. Then upload and verify the delivery link end to
end: status 200, content type, byte count, file header.

## Known traps (learned the hard way)

- PIL paste requires integer coordinates; project and round them.
- alpha_composite needs RGBA on RGBA; paste with a mask is different from
  alpha_composite and both have their place.
- Guard every segment function against zero-length time ranges.
- drawtext needs explicit fontfile and expansion=none; escape colons.
- amix with mixed mono and stereo inputs collapses to mono; pan each input
  to stereo explicitly.
- Image analysis tools often require files under the workspace, not /tmp.
- A 900-frame 1080p render takes minutes, not hours, but still preview first.

## Output contract

- The verified download link, first.
- Scene table with timestamps.
- Measured duration, resolution, loudness.
- Honest notes: what is stylized, what the user should check.
- The renderer source stays with the project so any scene can be re-rendered
  or re-timed later.

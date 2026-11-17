---
name: preview-or-perish
description: Forces cheap preview stills before any expensive full render of code-generated video, images, or PDFs. Catches layout bugs at ten frames instead of nine hundred. Use before every long render job.
---

# Preview Or Perish

A full render is where agents burn the most time discovering the bug that was
visible in frame one. This skill installs the gate: no long render starts until a
cheap preview passes a readable check.

## Workflow

1. **Choose the sentinel frames.** Pick 8 to 12 timestamps spread across the
   timeline, always including the first beat, every scene change, and the final
   frame. Scene boundaries are where bugs live.
2. **Render sentinels only.** Run the renderer in preview mode on those frames.
   Seconds of work, not minutes.
3. **Inspect as a contact sheet.** Assemble the stills into one labeled sheet and
   examine it: text readable, nothing overlapping or cut off, colors as intended,
   no missing layers, no placeholder content.
4. **Fix and re-preview.** Each fix reruns the sentinel set. Never patch blind.
5. **Only then render full.** With the sheet passed, start the full render. If the
   renderer supports ranges, render in chunks so an early failure costs little.
6. **Verify the output, not the code.** After the full render, extract frames from
   the actual encoded file and confirm they match the approved sentinels.

## Output contract
- SENTINELS: the chosen timestamps and why.
- SHEET VERDICT: pass, or the list of defects found and fixed.
- FULL RENDER: frames rendered, time taken.
- OUTPUT CHECK: frames extracted from the final file, compared against sentinels.

## Rules
- Ten preview frames are always cheaper than one full re-render.
- A contact sheet beats single frames: neighbors expose spacing bugs.
- The encoded file is the truth; the frame directory is only the recipe.

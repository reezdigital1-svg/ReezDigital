---
name: text-stylist
description: Turn plain video text into styled typography. Use when adding titles, captions, hooks, or end cards to a video edit and the text needs a font, color, and layout that match the brand and mood. Includes a verified 18-font library, color palettes, pairing rules, ffmpeg drawtext snippets, and safe-area sizing.
---

# Text Stylist

A typography stylist for video edits. Pick the font, palette, and layout from the catalog, then drop the ready-made ffmpeg drawtext snippet into the build. Every font in `fonts/` is verified to render in ffmpeg 9.x drawtext.

## When to use

- Any text overlay in a video edit: hooks, stats, captions, end cards, lower thirds.
- When the user asks for "better text", "styled titles", "a stylist look", or brand-consistent typography.
- When starting a new brand: pick a pairing from Pairings below and reuse it for every video.

## Font library (all verified in ffmpeg)

All files live in `fonts/` next to this SKILL.md. Reference them by absolute path in drawtext.

| File | Personality | Use for |
|---|---|---|
| BebasNeue.ttf | tall, condensed, punchy | hooks, big stats, uppercase impact |
| Anton.ttf | heavy, loud | single-word slams, numbers |
| ArchivoBlack.ttf | bold, modern, wide | headlines, statements |
| Inter-Black.ttf | ultra-bold neutral | stats, numbers, tech brands |
| Montserrat-ExtraBold.ttf | clean, confident | titles, corporate-friendly |
| Montserrat-Medium.ttf | quiet, readable | support lines, captions |
| Poppins-SemiBold.ttf | friendly, rounded | lifestyle, approachable brands |
| SpaceGrotesk-Bold.ttf | techy, contemporary | AI, startup, dev content |
| JetBrainsMono-Bold.ttf | code, terminal | code shots, technical labels |
| Orbitron-Bold.ttf | futuristic, sci-fi | AI tools, future-facing claims |
| Righteous.ttf | retro-futuristic | neon, synthwave, playful tech |
| Oswald-SemiBold.ttf | condensed, newsy | lower thirds, labels |
| PlayfairDisplay-Bold.ttf | elegant serif | luxury, editorial, finance |
| PlayfairDisplay-Italic.ttf | refined emphasis | accent words inside serif titles |
| Cinzel-Bold.ttf | luxury, engraved | premium, gold, high-end offers |
| AbrilFatface.ttf | fat editorial serif | big numbers, magazine hooks |
| Pacifico.ttf | warm script | casual CTAs, "follow us" |
| DancingScript-Bold.ttf | signature script | personal signatures, brand credit |

## Palettes

| Palette | Background | Primary | Accent | Support | Mood |
|---|---|---|---|---|---|
| Neon Glass | #05060F | #FFFFFF | #00F0FF | #B9C4D4 @ 0.85 | AI, tech, future |
| Violet Night | #0B0B10 | #FFFFFF | #7C3AED | #A78BFA @ 0.85 | creative, premium |
| Hot Signal | #08060E | #FFFFFF | #FF2E9A | #FFD1EC @ 0.85 | bold, viral |
| Money Talks | #050505 | #F5F1E8 | #CCFF00 | #C9C9C9 @ 0.85 | finance, luxury edge |
| Clean Light | #FFFFFF | #0A0A14 | #2563EB | #6B7280 | corporate, SaaS |
| Gold Engraved | #0A0806 | #F5E6C8 | #D4AF37 | #B8A98C @ 0.9 | luxury, Cinzel pairing |

## Pairing rules

1. One display font plus one support font per video. Never three display fonts.
2. Hook and stats take the display font. Support lines and captions take the support font.
3. Uppercase only for condensed display fonts (Bebas, Anton, Oswald, Archivo, Inter Black). Sentence case for serif and script.
4. Scripts (Pacifico, Dancing Script) get one short line per video, maximum.
5. Accent color goes on the single most important word or number, never whole lines.
6. Minimum size 40px at 1080p for support text, 64px for titles, 84px for hooks.
7. Keep all text above the bottom 15 percent safe area and inside 6 percent side margins.

## ffmpeg drawtext recipe

Escape colons as `\:` and always set `expansion=none`. Percent and dollar signs are safe with `expansion=none`.

Fade-in helper (T0 appear, T1 disappear, 0.4s fades):

```
drawtext=fontfile=/path/Font.ttf:text='YOUR TEXT':fontsize=88:fontcolor=#00F0FF:x=(w-text_w)/2:y=430:alpha='if(lt(t,T0+0.4),max(0,(t-T0))/0.4,if(lt(t,T1-0.4),1,max(0,(T1-t))/0.4))':enable='between(t,T0,T1)':expansion=none
```

Accent word in a second color: stack two drawtext lines, one per color, instead of trying inline colors.

Drop shadow for bright footage: add `shadowcolor=black@0.6:shadowx=3:shadowy=3` or place a `drawbox=color=black@0.30:t=fill` over the whole frame before text.

## Workflow

1. Ask or decide: brand, mood, vertical format.
2. Pick palette and pairing from the tables. Reuse the brand's saved pairing if one exists.
3. Write text lines first, then style them. Hook under 6 words. Support line under 8 words.
4. Insert the drawtext snippets into the build with scene-relative timings.
5. Render, extract frames at text-visible timestamps, and verify legibility by actually looking at the frames. Fix overlaps and size before delivering.

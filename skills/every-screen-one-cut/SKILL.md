---
name: every-screen-one-cut
description: Export one edit into every platform format correctly the first time. Vertical 9:16, square 1:1, and widescreen 16:9 each have different safe areas and specs, and a lazy re-crop buries text under platform UI. Use when delivering any video to Reels, Shorts, TikTok, feed posts, YouTube, or WhatsApp Status.
---

# Every Screen, One Cut

One edit, every screen. Reposting one render everywhere underperforms everywhere: vertical platforms bury square content, and a blind center-crop puts captions under the like button. This skill produces platform-native exports from a single master.

## The core rule

**Reframe first, text second, export last.** Captions burned before a crop end up off-frame. Every format decision is made together with caption position and pacing, never one after another.

## Platform specs (memorize these)

| Target | Resolution | Aspect | Audio | Notes |
|---|---|---|---|---|
| Reels / TikTok / Shorts / Status | 1080x1920 | 9:16 | AAC 128k, -14 LUFS | Same file serves all four |
| Feed post (IG/FB/LinkedIn) | 1080x1080 | 1:1 | AAC 128k, -14 LUFS | Less screen real estate; bigger text |
| YouTube / X widescreen | 1920x1080 | 16:9 | AAC 192k, -14 LUFS | Bottom 15 percent may hide under controls |
| WhatsApp Status | 1080x1920, under 30s | 9:16 | AAC | Hard 30 second limit per status; split longer cuts |

## Safe areas (the part everyone gets wrong)

Platform UI covers the frame edges. Text that ignores this gets buried:

- **9:16:** top 8 percent and bottom 20 percent are covered; 6 percent down each side is tight. On 1080x1920 that is 154 px top, 384 px bottom, 65 px sides. Put captions and key text between 60 and 72 percent of frame height, never in the bottom fifth.
- **1:1:** keep text within the middle 80 percent.
- **16:9:** keep text above the bottom 15 percent.

## Reframing rules

- Center-crop 16:9 to 9:16 throws away 70 percent of the width. Check the subject survives the crop before rendering; shift the crop window toward the subject when it does not.
- When cropping loses critical content, pad instead: blurred, scaled-up background fill beats black bars on every platform.
- Square from vertical: pad, never crop; a 9:16 to 1:1 center crop cuts heads.

## Export settings that always pass

```
-c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -r 30
-c:a aac -b:a 128k -ar 44100 -movflags +faststart
```

- `-pix_fmt yuv420p` is not optional: without it, some phones show black video.
- `-movflags +faststart` moves the index to the front so playback starts before the download finishes.
- Loudness: normalize to -14 LUFS (the Reels/Shorts/TikTok/YouTube standard). One loudness pass, then all exports.
- Bitrate sanity: a 30 second 1080x1920 export at CRF 20 lands around 8 to 15 MB. Anything wildly larger means a settings mistake.

## Batch pattern

From one master, produce the full set in one script: vertical, square, widescreen. Name files by every axis that varies: `topic_format_length.mp4`. Verify each export with a probe (resolution, duration, codec, loudness) before delivery, and extract one frame per export to confirm text placement survived the reframe.

## Verification

- 🟢 Probe every export: resolution, duration, fps, codec, audio channel count.
- 🟢 Extract and inspect one frame per format: text inside safe areas, subject intact.
- 🔴 Never deliver an export that was only described, not probed.

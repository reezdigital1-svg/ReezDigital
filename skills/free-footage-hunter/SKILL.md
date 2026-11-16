---
name: free-footage-hunter
description: Find and download license-safe stock video, music, and images for edits without paying and without attribution headaches. Use when a video needs B-roll, a music bed, or sound effects, and the buyer has no footage library.
---

# Free Footage Hunter

Great edits are assembled, not shot. The internet's free stock libraries cover almost any B-roll need, but licenses and blocked CDNs trap agents into either stealing or giving up. This skill sources legally, downloads reliably, and documents the license for the delivery report.

## The core rule

**No license, no download.** Every asset in the final edit carries a known license, recorded in the delivery notes: source site, license type, and whether attribution is required.

## The source ladder (try in this order)

1. **Mixkit** (mixkit.co): free for commercial use, no attribution required, direct MP4/MP3 URLs. First choice for video and music.
2. **Pexels / Pixabay**: free licenses, no attribution required, but CDNs often block scripted downloads (403). Use their APIs or fall through to Mixkit.
3. **Coverr**: free videos, no attribution.
4. **Freesound** (freesound.org): sound effects; check per-file license (CC0 vs CC-BY) and record attribution when required.
5. **Unsplash**: images only; free license.

## Direct URL patterns that work

Mixkit page listings expose direct asset URLs:

- Video: `https://assets.mixkit.co/videos/<id>/<id>-1080.mp4` (also `-720.mp4`, `-360.mp4`)
- Music: `https://assets.mixkit.co/music/<id>/<id>.mp3`

Scrape the category page (`/free-stock-video/<topic>/`, `/free-stock-music/tag/<tag>/`) with a browser User-Agent, collect `assets.mixkit.co` URLs, pick the highest resolution available.

## Download discipline

- Use a browser User-Agent on every request; stock CDNs reject bare clients.
- When `curl` is blocked in the environment, python `urllib` with a UA header works.
- Verify every download before use: file size is non-trivial, the container probes correctly (ffprobe reports a real duration), and the content matches the search intent.
- Keep original filenames plus a `sources.txt` in the project folder mapping each file to its source URL and license.

## Selection standards

- B-roll serves the script, not the other way around: search for the shot the story needs ("server room", "handshake", "city night"), not whatever the first page shows.
- Prefer clips with camera movement (push, orbit, parallax) over static shots; static B-roll reads as a slideshow.
- Duration discipline: download more than needed, cut to the edit. A 5 to 12 second clip covers most social scenes.
- Consistency: same visual family (color grade, era, setting) across scenes; mixed aesthetics read as a slideshow of other people's videos.

## Music rules

- Music carries the edit's energy; pick tempo to match cut pacing (high-energy topic, 100 to 128 BPM; thoughtful topic, 70 to 90 BPM).
- Duck the bed under narration to roughly 30 percent volume; never let music fight voice.
- Record the track name and source in the delivery notes; "some free track" is not a license record.

## Verification

- 🟢 Every asset probed (ffprobe) or opened (image) before it enters the edit.
- 🟢 `sources.txt` written with URL, license, and attribution requirement per asset.
- 🔴 Never embed an asset whose license is unknown, and never claim "royalty-free" without naming the source.

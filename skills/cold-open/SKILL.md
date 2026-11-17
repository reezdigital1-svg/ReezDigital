---
name: cold-open
description: >
  Turn a website URL into a finished, narrated promo video MP4 with sound
  design, verified quality checks, and a verified download link. Use when the
  user wants a promo, product video, explainer, launch video, or social video
  for a product, app, or website, and wants an actual video file delivered,
  not a script or a storyboard.
---

# Cold Open

Website URL in. Finished MP4 out. No question marathon, no blueprint handoff.
The user gets a rendered, narrated, quality-checked video with a download link
that has been fetched and verified before delivery.

## Why this exists

Script-only skills leave the user with homework. This skill closes the loop:
research, script, voiceover, motion render, sound design, mastering, and a
delivery link proven to work end to end.

## Workflow

### 1. Research the product (one pass, no interrogation)

Fetch the URL. Extract:
- Product name, one-line description, audience, tone
- Brand palette (hex), typography mood, aesthetic keyword
- 4 to 8 features, ranked by homepage prominence
- The site's primary call to action

If the site blocks fetching, ask once for pasted homepage copy. Never ask more
than one blocking question. Defaults handle everything else: 30 seconds,
16:9 landscape (9:16 if the user says Shorts, Reels, or TikTok).

### 2. Claims table

List every claim the video will make, with its source line from the site.
Never invent a statistic, customer, quote, or metric. If the site says nothing
about speed, the video says nothing about speed. Mark any illustrative visual
as illustrative.

### 3. Script

- Hook in the first 3 seconds: the viewer's pain, stated plainly.
- Then product, then 3 to 5 concrete feature moments, then one CTA.
- On-screen text: 6 words maximum per line, benefit first.
- Narration: 55 to 70 percent of runtime. About 2.4 words per second.
- The closing line names the product and matches the site's own wording.
- Voiceover: use any TTS available in the session. Report the cost of paid
  tools and keep total narration under 40 seconds for a 30 second cut.

### 4. Render

Build frames in code (PIL, numpy, or the frames-from-nothing engine). Follow
the SaaS explainer conventions that make templates sell:
- 3D perspective device mockups with decks, shadows, and reflections
- A camera dive into the screen at least once
- Light sweeps, glows, and a lens flare on the end card
- Sound design: whoosh on transitions, ticks under count-ups, chimes on reveals
- Brand override rule: the video carries the product's own name and brand,
  never the tool's, never the template's

### 5. Verify before delivery

All of these, in order:
1. ffprobe: duration, resolution, fps match the plan
2. Loudness: integrated -14 LUFS (accept -13.5 to -14.5), true peak under -1 dB
3. Extract 5 frames across the timeline and inspect them for cut-off text,
   overlaps, empty frames, and brand errors
4. Encode: H.264, yuv420p, AAC stereo, faststart

### 6. Deliver a verified link

Upload the MP4 to a file host. Then verify the link before giving it to the
user: HTTP status 200, correct content type, byte count matching the upload,
and a valid MP4 header on the downloaded bytes. Never deliver an unverified
link. Never push the video file to a repository. Temporary preview URLs are
for previews only, never for downloads.

## Output contract

- The verified download link, first.
- A storyboard table: time, scene, what the viewer learns.
- Measured numbers: duration, resolution, loudness.
- Honest notes: what is estimated, what is illustrative, what the user should
  check (audio pronunciation, claim accuracy).
- Costs: any paid tool calls made, itemized.

## Rules

- One blocking question maximum. Defaults for everything else.
- Fresh visuals per video. Never reuse a previous video's scenes or footage
  for a new topic.
- Never deliver a script when a video was asked for.
- If rendering is impossible in the environment, say so plainly and deliver
  the strongest possible fallback, labeled as such.

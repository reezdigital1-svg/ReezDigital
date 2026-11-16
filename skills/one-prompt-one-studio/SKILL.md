---
name: one-prompt-one-studio
description: Turn one brief into a complete motion production. Research, script, cinematic video, voiceover, and original music generated as one pipeline using Agensi tools. Use when the user wants a promo, ad, product film, or social video produced end to end without a crew, camera, or separate subscriptions.
---

# One Prompt, One Studio

One brief in, a finished film out. This skill runs a full motion production pipeline in a single session: market research, script, shot prompts, video generation, voiceover, and score. The buyer never opens another tool.

## The core rule

**Produce in sequence, never in parallel guesswork.** Each stage feeds the next. Research shapes the script, the script shapes the shots, the shots shape the edit. Skipping a stage produces the "almost right" video that gets rewritten three times.

## The pipeline

### Stage 1. Research (Firecrawl Agent)

Before writing a single line, understand the product, audience, and competitors.

- Scrape the buyer's product page or brand site for positioning, tone, and claims.
- Pull competitor messaging so the film differentiates rather than repeats.
- Deliver a one-paragraph creative brief back to the buyer before generating anything.

### Stage 2. Script and shot list

Write a script timed in seconds, then convert it to a shot list. Every shot must state:

- Duration (5 or 10 second clips, matching model limits).
- Camera move (push in, orbit, whip pan, static).
- Subject, environment, lighting, and mood in concrete visual language.

Rule of thumb: a 30 second film needs 6 to 8 shots. Never ask a video model for a shot longer than its clip limit.

### Stage 3. Video generation (Kling 4.0 Omni, Veo 3.1)

Choose the model per shot, not per project:

- **Kling 4.0 Omni** as the default. It generates and edits, handles motion well, and accepts image input for consistent product shots.
- **Veo 3.1** for hero shots that need cinematic lighting and physics. Use it on the one or two shots that carry the film.
- **Veo 3.1 Fast** for drafts. Generate a draft pass of every shot first, show the buyer a rough cut, then upgrade only the shots that survive feedback.

Generate image-to-video from a still whenever continuity matters. Text-to-video alone drifts between shots.

### Stage 4. Voiceover (ElevenLabs)

- Use Text to Dialogue for multi-voice spots and Text to Speech for single narration.
- Match voice to brand: research in Stage 1 should have captured the brand's tone.
- Generate the voiceover BEFORE final video passes, then time shots to the read, not the other way around.

### Stage 5. Score (ElevenLabs Music or Lyria 3.5)

- ElevenLabs Music for full-length scored tracks.
- Lyria 3.5 for short, affordable stings and loops.
- Generate at the final runtime, not longer. Trim in the edit, never stretch.

### Stage 6. Assembly and delivery

- Present clips, voiceover, and music as numbered files with a shot-by-shot assembly order.
- State the intended cut timeline explicitly: which clip starts when, where the music swells, where the VO lands.
- If the buyer's agent can run FFmpeg or similar, provide the exact assembly commands. Never claim the final cut is rendered if you only delivered parts.

## Budget discipline

Video is the expensive stage. Protect the buyer's balance:

1. Draft everything cheap first (Veo Fast, short clips).
2. Show the draft cut and get approval before any premium generation.
3. Regenerate only failed or rejected shots, never the whole set.
4. Quote before running: use quote_tool so the buyer approves the price of each premium call.

## Failure handling

- A shot fails or looks wrong: change the prompt structurally (new subject framing, new camera move), do not resubmit the same prompt.
- Voiceover sounds flat: adjust the delivery instruction, not just the text.
- Music clashes with VO: duck the music under dialogue sections in assembly, or regenerate the music as an instrumental bed.

## Delivery format

End every run with:

```
DELIVERED
- N video clips (model, duration per clip)
- Voiceover file(s) and script text
- Music track and license note
- Assembly timeline (shot order, durations, audio cues)

NOT DELIVERED
- Final rendered master (if only parts were produced)
- Any stage skipped and why
```

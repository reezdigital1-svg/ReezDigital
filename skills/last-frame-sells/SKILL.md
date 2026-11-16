---
name: last-frame-sells
description: Build branded end cards that convert viewers into followers. The final 3 to 5 seconds of a video are the only moment the viewer is ready to act, so the last frame must carry the brand, one call to action, and nothing else. Use when finishing any social video, ad, or promo that needs a closing card.
---

# The Last Frame Sells

The end card is not an outro. It is the conversion moment. A viewer who watched to the end is the hottest audience you will ever get, and the last frame decides whether they follow, click, or scroll away.

## The core rule

**One card, one action, three seconds.** More than one ask is zero asks. A cluttered end card is an unfollowed account.

## The anatomy of a converting end card

Every end card carries exactly four elements, in this order of importance:

1. **The action** (largest element): one verb, one outcome. "Follow for the truth about AI agents." Never "like, comment, subscribe, and share."
2. **The brand** (second largest): name plus wordmark or consistent type treatment. Same position, same color, every video, so the catalog reads as one body of work.
3. **The payoff line**: the promise the video just delivered, compressed to one line. It reminds the viewer what following buys them.
4. **The visual anchor**: the frame behind the text stays on-brand (brand background, hero frame, or product shot), never black.

## Timing rules

- Hold the card for at least 3 seconds and at most 5. Under 3 and nobody reads it; over 5 and retention graphs cliff.
- Fade the card in over 0.4 seconds. Hard cuts to an end card feel like an error screen.
- If the platform loops the video (Reels, Shorts, TikTok), the end card must visually hand off to the opening hook. Loop seamlessness doubles watch time.
- Never bury the payoff in the card. If the video's last spoken line matters, start the card AFTER it, not during it.

## Building it with ffmpeg

Preferred: render the card as a PNG (Pillow, Canva export, or generated HTML screenshot), then:

```
ffmpeg -i main.mp4 -loop 1 -t 4 -i endcard.png \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.4:offset=MAIN_DUR[v]" \
  -map "[v]" -map 0:a -c:v libx264 -crf 20 -c:a aac -movflags +faststart out.mp4
```

Fallback (no PNG): drawtext on a frozen or looping last frame, text centered at 40 percent frame height, brand below it. Escape `%` as `%%` and set `expansion=none` unless using timestamps.

## Safe areas

The card must sit inside the platform's clear zone or the UI buries it:

- 9:16 vertical: top 8 percent and bottom 20 percent are covered by platform UI. Center the action line around 40 to 55 percent of frame height.
- 1:1 square: keep all text within the middle 80 percent.
- 16:9: bottom 15 percent can be covered by player controls; keep text above it.

## Verification

Never deliver an end card unseen:

- Extract frames at card start, card middle, and final frame; look at all three.
- Confirm the action line is fully readable at thumbnail size (zoom out to 20 percent).
- Confirm the loop seam: last frame to first frame should not flash or jump.
- Probe the output: duration grew by the card length, audio still ends cleanly.

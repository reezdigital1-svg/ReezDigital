---
name: clip-fresh
description: Sources licensed stock footage that actually downloads, with a freshness rule against reusing clips across videos. Use when a video needs real-world footage and AI generation is unavailable or unaffordable.
---

# Clip Fresh

Reused clips burn a channel's credibility, and many stock sites block automated
download entirely. This skill finds footage that is licensed, on topic, and
actually retrievable today.

## Workflow

1. **Define the shot list.** From the script, list every moment that needs
   footage, with subject, mood, and orientation. Search the list, not the vibe.
2. **Work the sources that allow programmatic access.** Verified working order:
   - Mixkit (free license, direct MP4 URLs, category pages scrapeable).
   - Coverr (free license, direct MP4 URLs).
   - Pexels and Pixabay: browser-only for automated flows, do not scrape.
   - Envato and other paid markets: browse and study, never download without a
     purchased license. Mirror sites are piracy and are never used.
3. **Probe before trusting.** Fetch each candidate URL and confirm status 200,
   video content type, and a real MP4 header. Sites return 403 on some IDs for
   no visible reason; only verified files count.
4. **Enforce the freshness rule.** Any clip used in a previous published video is
   disqualified. Keep a used-clip log per channel and check it before download.
5. **Verify the fit.** Extract a thumbnail from each candidate and inspect: does
   it show the subject, does the mood match, is the resolution adequate for the
   target frame? Reject anything that merely contains the right keyword.
6. **Log the license.** Record source, license type, and clip ID for every clip
   that ships. Give attribution where the license asks for it.

## Output contract
- SHOT LIST: moments needing footage.
- SOURCED: clip ID, source, license, duration, resolution, thumbnail verdict.
- REJECTED: candidates that failed, with the reason.
- LOG: updated used-clip record.

## Rules
- A clip that downloads is not a clip that fits; verify visually.
- Free license still has terms; record them.
- One good on-topic clip beats five generic ones; cut the shot list before padding.

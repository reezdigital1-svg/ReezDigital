---
name: mono-trap
description: Audio QA for agent-rendered video. Catches mono collapse, silent channels, clipping, loudness misses, and offset VO before upload. Use after every video encode, before any link is delivered.
---

# Mono Trap

The most common silent failure in code-rendered video is a stereo mix that
collapsed to mono because one mono input leaked into the mixer. It passes every
visual check and sounds amateur on a phone speaker. This skill exists to catch it.

## Workflow

1. **Probe the file.** Run ffprobe and record: duration, resolution, fps, codec,
   pixel format, sample rate, channel layout. If the audio stream says anything
   other than stereo, stop and fix the mix.
2. **Run the five checks with ffmpeg:**
   - CHANNELS: stream layout must be stereo. Mono here means an input was mixed
     without a pan filter; fix with pan=stereo|c0=c0|c1=c0 on every mono input
     before amix.
   - LOUDNESS: ebur128 integrated loudness. Target -14 LUFS for social platforms,
     accept -16 to -13. Outside that, re-run loudnorm.
   - TRUE PEAK: above -1.5 dBTP means clipping risk on playback; engage a limiter.
   - SILENCE: silencedetect over the track. Long dead air at the start kills
     retention; trim or fade it.
   - SYNC: does the first spoken word land where the picture expects it? Spot
     check the first and last narration lines.
3. **Fix, then re-run every check.** A fix that passes only its own check often
     breaks another; the full battery reruns each time.
4. **Issue the receipt.** A video without a passed audio receipt does not ship.

## Output contract
- SPEC: duration, resolution, fps, codec, layout.
- CHECKS: five rows, each with measured value, target, PASS or FAIL.
- RECEIPT: one line stating the file is cleared for delivery, or the failing check.

## Rules
- Never trust the encode command; trust the encoded file.
- loudnorm twice is normal: the first pass measures, the second confirms.
- Report measured numbers, not "should be fine".

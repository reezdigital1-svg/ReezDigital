---
name: receipts-or-it-didnt-happen
description: >
  Force any agent task to end with evidence instead of claims. Use when the
  user asks an agent to build, fix, deploy, render, research, or analyze
  anything and wants proof the work actually works: commands run with output,
  links fetched, files checked, plus an explicit list of what was not
  verified. Applies before any "done" is reported.
---

# Receipts Or It Didn't Happen

An agent that says "done" without evidence is guessing. This skill makes
verification the finish line of every task: the narrowest real check first,
evidence attached, and an honest list of everything that was not verified.

## Why this exists

The number one frustration with AI agents is output that is almost right but
not quite. Agents grade their own homework and pass themselves. This skill
separates claiming from proving: nothing counts as done until something in the
real world was observed to work.

## The core rules

1. **Run the narrowest real check first.** Before building more, run the
   smallest command or fetch that proves the current state. One command beats
   ten paragraphs of explanation.
2. **Never trust self-written tests as proof.** An agent writing a test and
   the same agent passing it is one source. Corroborate with an independent
   check: run the actual artifact, fetch the actual URL, open the actual file.
3. **Claim only verified state.** "The site is deployed" requires a fetch of
   the live URL showing the new content. "The bug is fixed" requires running
   the failing case and showing it pass.
4. **One retry, then report.** If a check fails twice, stop, report the exact
   error, and name the blocker. Do not loop.
5. **The unverified list is mandatory.** Every task ends by naming what was
   not checked. Honesty about gaps is part of the deliverable, not a failure.

## Verification ladders by artifact type

### Code
- Run the code or the narrowest reproducing command, show the output.
- Self-written tests count only as one source; add one independent check.
- State what was run, the exit status, and the key output lines.

### Deployed site or API
- Fetch the live URL: status code, content type, and one marker that proves
  this is the new version (a string unique to the change).
- Check the specific endpoint or asset that changed, not just the homepage.

### Video or audio
- Probe the file: duration, resolution, streams, fps.
- Measure loudness on the final encode.
- Extract frames at several timestamps and inspect them.
- For any delivered link: download fully, check status, content type, byte
  count, and file header before presenting it.

### Data and analysis
- Recompute totals from the raw source, not from intermediate summaries.
- Spot check at least three rows against the original.
- State the row count in and the row count out.

### Research and writing
- Fetch each cited source and confirm it says what is claimed.
- Mark every unverifiable claim as unverified in the output.

## Output contract

End every task with this block:

```
RECEIPTS
- [artifact] [check performed] [result, with the key output line]

VERIFIED
- [claims backed by evidence above]

NOT VERIFIED
- [what was not checked, and why]

VERDICT
- GREEN: verified and working / YELLOW: working with caveats / RED: blocked
```

If the task is trivial, compress the block to one line. Never omit the
NOT VERIFIED section silently.

## Tone

Report evidence, not effort. "I ran the deploy and fetched the URL, status
200, new headline present" is a receipt. "I have successfully deployed the
site" is a claim. Deliver the first kind.

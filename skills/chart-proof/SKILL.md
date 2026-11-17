---
name: chart-proof
description: Catches misleading charts, cherry-picked stats, and broken number claims before publishing. Use on any report, dashboard, slide, or post that shows data, including AI-generated charts.
---

# Chart Proof

Numbers gain authority the moment they are drawn, even when they are wrong. This
skill audits the drawing before the audience does.

## Workflow

1. **Trace every number to a source.** Untraceable numbers are flagged, not
   deleted. The report says which claims carry receipts and which do not.
2. **Run the seven traps, in order:**
   - TRUNCATED AXIS: bar charts whose y-axis does not start at zero inflate small gaps.
   - DUAL AXIS: two units on one plot invites any story; check the scales honestly.
   - CHERRY WINDOW: does the date range start at an unusual dip or peak?
   - PERCENT BASE: percent of what? A "300% increase" on a tiny base is a rounding error.
   - SAMPLE SIZE: n below 30 gets a warning label, not confidence.
   - CORRELATION DRESS: causal language on correlational data gets rewritten.
   - AGGREGATE HIDING: averages without spread hide the actual users.
3. **Check the visual encoding.** Area and circle sizes must scale with the square
   of the value, color scales must be perceptual, labels must match the data.
4. **Rewrite the claim line.** For each finding, offer the honest version of the
   sentence, same data, no spin.
5. **Verdict per chart:** CLEAN, MISLEADING (with the trap named), or UNSUPPORTED.

## Output contract
A table: chart or claim, trap found, evidence, honest rewrite, verdict.

## Rules
- Never silently fix a chart; name the trap so the author learns it.
- Honest rewrites keep the data and drop the spin, never the reverse.
- If the underlying data is unavailable, the verdict is UNSUPPORTED and the chart
  should not ship.

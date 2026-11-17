---
name: pixel-jury
description: Judges a UI screenshot against the stated intent, with no reference image needed. Returns a verdict, ranked defects, and concrete fixes. Use after building any interface, from a landing page to a dashboard, to catch what code review cannot see.
---

# Pixel Jury

An agent that never looks at its own interface ships broken layouts with a clean
conscience. This skill makes the screenshot the witness. One image, stated intent,
honest verdict.

## Workflow

1. **Capture honestly.** Screenshot the real rendered output at the real viewport.
   Never judge a design file or a mental image. If you cannot screenshot, say so
   and stop; guessing is a false verdict.
2. **Write the intent line.** One sentence: what is this screen for and who is it
   for? Every judgment hangs on this line.
3. **Judge in five passes, in order:**
   - HIERARCHY: does the eye land on the most important element first?
   - CLARITY: is every label readable, contrast safe, nothing truncated?
   - ALIGNMENT: edges, spacing rhythm, consistent radii and weights?
   - TRUST: does it look finished? Misaligned icons and default fonts read as abandoned.
   - INTENT: would the target user understand the action within five seconds?
4. **Score each pass 0 to 10 with one sentence of evidence.** Evidence means what
   you see, not what the code says.
5. **Rank defects by damage:** blocks the intent, confuses, or merely irritates.
6. **Fix and re-judge.** After each fix, take a new screenshot and re-run the five
   passes. A fix without a re-look is a rumor.

## Output contract
- INTENT: one line.
- SCORES: five passes, each with a number and one sentence of evidence.
- DEFECTS: ranked, each with location, what is wrong, and the fix.
- VERDICT: SHIP, FIX FIRST, or REBUILD.
- RE-JUDGED: scores after fixes, new screenshot required.

## Rules
- Never declare SHIP from a screenshot you did not take.
- One blocking defect holds the verdict, no averaging.
- Describe pixels, not intentions: "the button is 12px from the edge", not "spacing is off".

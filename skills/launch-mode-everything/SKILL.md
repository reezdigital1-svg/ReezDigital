---
name: launch-mode-everything
description: Execute any prompt as a full product launch. The agent decodes the real ask, positions the result for an audience, builds it to a professional standard, verifies it with evidence, and ships it with a rollout plan. Use on any task, code, content, video, design, documents, or strategy, where the result should land like a release, not a draft.
---

# Launch Mode: Everything

Every prompt is a launch. Most agents stop at "task complete." This skill makes the agent ship: position the result, build it properly, prove it works, and hand over a rollout plan. The buyer receives a release, not a draft.

## The core rule

**A task is not done when it is made. It is done when it is ready to land.** Making is half the job. The other half is positioning, proof, and rollout.

## Stage 0. Decode the ask

Before doing anything, answer four questions in one short block:

- **What** is actually being asked for (the deliverable, in one sentence)?
- **Who** will see or use it?
- **Why** does it exist (the outcome the buyer wants)?
- **What does done look like** (the observable state that means finished)?

If the prompt is vague, state your best interpretation and proceed. Do not stall on questions the work itself will answer.

## Stage 1. Positioning

Treat the deliverable like a product:

- **Audience:** who it is for, in one line.
- **Promise:** the one sentence that makes that audience care.
- **Hook:** the angle, name, or opening line that stops them.
- **Standard:** the professional bar it must clear (name it: "agency-grade", "production-ready", "publish-ready").

If the deliverable is code, positioning still applies: who uses it, what promise it fulfills, what makes it land.

## Stage 2. Build

Produce the deliverable at the named standard.

- Work in the strongest available form: real files, real pages, real renders, real copy. Never describe what you could build when you can build it.
- Match the domain's professional conventions (design systems for sites, structure for documents, timing for video).
- If a specialist tool is available (image, video, voice, search), use it. Do not simulate output you can generate.

## Stage 3. Proof

Never claim the launch works without evidence. Run the narrowest real check:

- Code → run the test, build, or fetch the live URL.
- Content → read it back against the promise in Stage 1.
- Media → confirm the file exists, plays, and matches the brief.
- Anything unverifiable in this environment → say so explicitly and provide the exact command for the buyer.

Report as:

```
🟢 Verified: <claim> — <evidence>
🔴 Not verified: <claim> — <why, and what the buyer should run>
```

## Stage 4. Rollout

Close with a launch sheet, not a summary:

```
LAUNCH SHEET
- Shipped: <the deliverable, one line>
- Audience: <who it is for>
- Hook: <the angle that makes it land>
- Proof: <verified claims with evidence>
- Rollout: <2 to 4 next moves: where to publish, what to test, what to iterate>
- Open gaps: <what was not verified or not built>
```

## Anti-patterns

- **The homework hand-in.** Delivering the artifact with no positioning, no proof, and no next moves.
- **The humble draft.** "Here is a rough version" when the standard was production-ready.
- **The unverified launch.** Announcing success on output no one has run or seen.
- **The stalled interrogation.** Asking five clarifying questions when one assumption and a strong first build would do.

## Limits

This skill disciplines execution. It does not override platform safety rules, and it does not fabricate verification: a launch claim without evidence is a failed launch.

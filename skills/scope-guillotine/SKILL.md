---
name: scope-guillotine
description: Cuts an oversized request into a shippable 24-hour slice with an explicit cut list, keep list, and ship plan. Use when a task is too big for one session, the user wants everything, or scope keeps growing mid-build.
---

# Scope Guillotine

Agents fail by building the whole cathedral when the user needed a chapel by Friday.
Run cost and abandoned work are top complaints from agent users. This skill cuts
scope on purpose, in writing, before any code is written.

## When to swing it
- The request implies days of work but the session has hours.
- "Make it like X but also Y and Z" with three or more deliverables.
- A build grows new requirements mid-task.

## Workflow

1. **Restate the outcome in one sentence.** If you cannot, the brief is broken;
   say so and ask one question, never a questionnaire.
2. **List every implied deliverable** from the request. Name them, count them.
3. **Apply the blade.** Sort into three lists:
   - KEEP: without this the outcome sentence is false.
   - CUT NOW: nice to have, not needed for the outcome.
   - CUT FOREVER: nobody asked for this except your imagination.
4. **Price the slice.** Estimate steps and rough time for KEEP only. If it still
   exceeds the session, cut again. A working 60 percent beats a broken 100.
5. **Show the cut list first.** The user approves the cuts before you build.
   Silent cutting is how trust dies; visible cutting is how trust is built.
6. **Build only KEEP.** When new requests arrive mid-build, they go on a
   PARKED list, never into the current slice.
7. **Close with the parked list** so nothing is silently lost.

## Output contract
- OUTCOME: one sentence.
- KEEP: numbered items with rough effort each.
- CUT NOW / CUT FOREVER / PARKED: explicit, with one-line reasons.
- SHIP PLAN: ordered steps for this session.

## Rules
- Never cut quality of what ships; cut quantity of what is attempted.
- The user can veto any cut. Present, do not decide alone.
- One sentence of outcome beats one page of plan.

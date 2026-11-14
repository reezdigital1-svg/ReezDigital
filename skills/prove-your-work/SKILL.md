---
name: prove-your-work
description: Force independent verification of agent work before claiming success. Run real checks, never trust self-written tests as proof, and report only verified state with evidence. Use when finishing any code change, deployment, migration, or bug fix — especially before telling the user it works.
---

# Prove Your Work

The #1 complaint about AI agents is work that is "almost right, but not quite." Almost-right work fails silently because it was never run. This skill makes verification mandatory and honest reporting non-negotiable.

## The core rule

**Never claim a state you have not observed.** If you did not run the check and see the output pass, the correct report is "not verified," not "done."

## 1. Verify before you claim

For every change, name the narrowest real check that would catch failure, then run it:

- Code change → run the test, build, typecheck, or lint that covers it.
- Bug fix → reproduce the bug first, confirm the fix removes it.
- Deployment → fetch the live URL and confirm the new content actually serves.
- Config/infra change → run the command that reads the config and shows it took effect.

"Should work" and "looks correct" are not verification. Reading your own diff is not verification.

## 2. Never grade your own homework

Tests you wrote to match your own implementation prove nothing about correctness — they prove your implementation matches your assumptions.

- Prefer existing project tests over new ones you wrote for this change.
- If you must write a test, also break the code deliberately and confirm the test fails. A test that cannot fail proves nothing.
- Where possible, verify through an independent path: run the real binary, hit the real endpoint, load the real page.

## 3. Evidence-based reporting

Every status claim needs evidence attached:

- The exact command run.
- The relevant output (pass/fail line, version number, HTTP status, live response).

Report format:

```
🟢 Verified: <claim> — <command> → <output>
🟡 Partial: <what was checked, what was not>
🔴 Not verified / failing: <claim> — <why>
```

## 4. The "I did not verify" list

End every substantial piece of work with an explicit list of things you did NOT check. Example:

```
Not verified:
- Mobile Safari rendering (no browser in this environment)
- Production database migration (not run — needs approval)
```

An honest gap list builds trust. A hidden gap destroys it.

## 5. Almost-right traps

Watch for these patterns that produce "almost right" work:

- **The fix that fixes the symptom you saw, not the cause.** Reproduce first; understand why it failed.
- **The test that passes because it tests nothing.** Check assertions exist and are meaningful.
- **The deploy that succeeded but serves old content.** Verify the live URL, not the deploy log.
- **The refactor that compiles but changes behavior.** Diff behavior, not just syntax.
- **The example in docs that was never run.** Run every command you put in front of a user.

## 6. When you cannot verify

Say so immediately and concretely: what check is needed, what access or environment it requires. Offer the exact command the user can run themselves. Never fill the gap with confidence.

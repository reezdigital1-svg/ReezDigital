---
name: agent-roundtable
description: Make AI agents talk to each other and figure things out together. Use when a decision is hard, stakes are high, or a first answer feels too easy. Runs a structured multi-persona debate with an advocate, a skeptic, a fact checker, and a judge, then delivers a consensus decision with recorded dissent.
---

# Agent Roundtable

A deliberation protocol that turns one agent into a room of specialists who argue until the best answer survives. Modeled on how real decision meetings should work, not how they usually go.

## When to run a roundtable

- The question has more than one defensible answer.
- The cost of being wrong is high: money, reputation, time, or safety.
- The first answer arrived suspiciously fast or feels too clean.
- The user says "think harder", "are you sure", or "what am I missing".

Do not run a roundtable for simple lookups, trivial tasks, or when the user needs speed over rigor.

## The seats

Fill four seats. Each is a distinct expert persona with its own priorities and its own way of failing. Name them and keep them consistent through the whole session.

1. **The Advocate** argues for the most promising option. Pushes momentum, finds the strongest version of the idea. Fails by overselling.
2. **The Skeptic** attacks assumptions, hunts for hidden costs, failure modes, and second-order effects. Must propose at least one way the plan fails. Fails by blocking everything.
3. **The Fact Checker** separates what is known, what is assumed, and what is invented. Every claim gets tagged: verified, assumed, or unverified. Fails by nitpicking trivia.
4. **The Judge** does not argue. Tracks the argument, enforces the rules, and rules only on what survived. Fails by deciding too early.

## The rules

1. **Argue in rounds, not monologues.** Each round: Advocate states the case, Skeptic attacks the weakest point, Fact Checker tags the claims used, Judge summarizes what changed. Minimum two rounds before any verdict.
2. **Steelman first.** The Skeptic must state the Advocate's position in its strongest form before attacking it. No strawmen.
3. **Claims carry tags.** A claim without a tag is treated as unverified. The Fact Checker maintains a running ledger: verified (with evidence), assumed (with owner), unverified (with how to verify).
4. **Update in the open.** When a seat changes its position, it says so explicitly and names the argument that changed its mind. Changing position is winning, not losing.
5. **Dissent is recorded, never erased.** If the Skeptic is not convinced at the end, the dissent ships with the decision.
6. **The Judge rules on process, not popularity.** The winning option is the one that survived attacks, not the one that argued longest.

## The output

End every roundtable with:

```
DECISION: <one sentence>
WHY IT WON: <the argument that survived, in two sentences>
CONDITIONS: <what must be true for this to work>
DISSENT: <recorded objections, or "none">
UNVERIFIED: <claims still unproven, each with the exact check that would prove it>
NEXT CHECK: <the single fastest way to find out if this decision is wrong>
```

If the debate deadlocks after four rounds, the Judge does not force consensus. Deliver the decision with the strongest dissent attached and name the experiment that would settle it.

## Multi-agent mode

If the environment has more than one real agent available (for example two coding agents, or an agent connected to a second model), assign the seats to different agents instead of personas. The protocol is identical; the value is higher because the seats genuinely cannot read each other's minds. Pass each agent only its own seat's instructions plus the transcript, never the other agents' private reasoning.

## Anti-patterns

- Five personas all agreeing in round one is a failed roundtable. Restart with a stronger Skeptic mandate.
- A Judge who summarizes instead of ruling has not done the job.
- A Fact Checker who tags everything "verified" without evidence is a liability. Unverified is an acceptable answer; fake confidence is not.
- Never let the Advocate write the final summary alone.

---
name: kill-switch-first
description: Stop AI agents from burning money. Set hard budgets, pre-flight cost checks, and circuit breakers BEFORE the first call, so a runaway loop dies mid-run instead of dying on the invoice. Use when building, running, or reviewing any agent that calls paid APIs, models, or tools.
---

# Kill Switch First

A runaway loop is not something you find in the logs. It is something you find on the invoice. Real cases: one engineer's $1.3M single-month bill, a $700 overnight loop, an annual AI budget burned in four months. The fix is never an alert. Alerts fire after the next call is already allowed. The fix is a stop mechanism built before the first call.

## The core rule

**Build the kill switch before you build the agent.** If a mechanism cannot terminate a run mid-execution, it is monitoring, not control.

## 1. Budgets attach to the run, not the account

Account-level spend caps limit the damage. Run-level caps stop the loop.

- Before the first call, set a hard budget for the run: max spend, max steps, max tool calls.
- Enforce it on the caller side, not the model. The model cannot be trusted to count its own spend.
- When the budget trips, kill the execution immediately. Log the termination with a named agent, a spend figure, and a timestamp.

## 2. Pre-flight cost check on every call

A decision point before the call, not after the bill:

- Estimate the cost of each call before dispatching: input token count times price, plus the max possible output (max_tokens times output price).
- Hold that estimate against the remaining run budget. If the call could cross the ceiling, refuse it.
- Treat timed-out calls as spent, not free. Unresolved spend is still spend.

## 3. Circuit break the loop patterns

The expensive failures are structural, not accidental:

- **Same tool, same args, repeatedly** → breaker: block the third identical call.
- **Retry storms** → cap retries per call, make retries idempotent so a reconnect cannot turn one runaway into two.
- **Subagent spawning** → a subagent inherits the parent's remaining budget, never a fresh one.
- **Fallback chains** → escalation to a stronger model costs more per call; count it against the same budget.
- **Context re-reading** → an agent that re-reads the same file every turn burns ten times more than one that caches it. Cache once.

## 4. Attribute every unit of spend

Visibility tells you what is happening. Enforcement stops it. Both need attribution:

- Track cost per tool call, per model, per workflow, and per fallback.
- Report cost per accepted result, not cost per run: total spend divided by outputs that actually made it into the product.
- The bill should never be the first place a loop is discovered.

## 5. The kill switch checklist

Before any agent runs in production, confirm:

- [ ] Hard per-run budget, enforced caller-side, kills execution mid-run
- [ ] Pre-flight cost estimate on every paid call
- [ ] Circuit breaker on repeated identical calls
- [ ] Retry caps with idempotent retries
- [ ] Subagents inherit the parent budget
- [ ] Per-call cost attribution logged
- [ ] A watchdog can see run progress and force-stop it
- [ ] Auto top-up disabled

## Limits

This skill designs the control system; it does not replace your provider's billing tools. Combine run-level enforcement with provider-side caps so the damage ceiling exists even when the caller is the bug.

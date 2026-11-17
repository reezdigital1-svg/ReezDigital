---
name: kill-the-smell
description: >
  Detect and remove AI writing patterns with evidence, then prove the rewrite
  preserved meaning. Use when the user asks to humanize, de-AI, naturalize, or
  improve writing; when text sounds robotic, generic, or machine-structured;
  or when they want every AI-smell phrase listed with counts before and after
  the rewrite. Covers email, LinkedIn, X, blog, essay, and marketing copy.
---

# Kill The Smell

Rewrite AI-sounding text into natural professional prose, with receipts. Every
offense is named and counted, every fact is tracked, and the rewrite is proven
to preserve meaning. No synonym swapping, no vibes, no silent drift.

## Why this exists

Most humanizing tools rewrite blindly. They produce a new draft, and the user
has to trust that the facts survived. This skill works in the opposite order:
detect and show the evidence first, rewrite second, verify meaning third.

## Workflow

### 1. Profile the text

Identify before touching anything:
- Platform and format (email, LinkedIn post, blog, essay, ad copy)
- Audience and register (casual stays casual, formal stays formal)
- Language and locale (punctuation, date formats, idioms follow the locale)
- Hard facts to protect: names, numbers, links, quotes, code, claims

### 2. Detection pass (evidence first)

Scan the full text and count every occurrence of each pattern class:

| Class | Examples |
|---|---|
| Filler and hedges | "it is important to note", "in today's fast-paced world", "arguably", "somewhat" |
| Stacked abstractions | three or more abstract nouns on one weak verb ("utilize solutions for optimization of deliverables") |
| Generic framing | intros and conclusions that could fit any topic on earth |
| Machine symmetry | bullet lists where every item has identical rhythm and length |
| Repetition loops | the same idea restated with minor paraphrase |
| Tired AI vocabulary | "delve", "tapestry", "leverage" as a verb, "unlock", "seamless", "robust", "landscape" as metaphor |
| Overused punctuation | more than one em dash pair per 500 words; em dash chains |
| Faux-structure | "not just X, but Y" more than once; rule-of-three more than twice |

Output the detection table: pattern class, count, and one quoted example per
class. If the table is empty, say the text is clean and stop. Do not invent
problems to seem useful.

### 3. Rewrite

Restructure before rewording:
- Break machine symmetry: vary sentence length deliberately. Aim for a mix
  where the shortest sentence is under 8 words and the longest is over 20.
- Replace stacked abstractions with concrete, ordinary language.
- Delete filler rather than replacing it.
- Reorder points when the structure reads like a template.
- Keep the register stable. Do not over-polish into marketing speak.
- One idea per sentence. Active voice. Plain words.

### 4. Meaning ledger (the proof)

List every fact, number, link, name, and claim from the source. For each,
confirm it appears in the rewrite with the same meaning. Flag anything that
changed, was dropped, or was softened. If a fact could not survive the
rewrite, restore it and adjust the prose instead.

### 5. Read-aloud test

Read the rewrite as one paragraph. If any sentence would make a listener
stumble, rewrite that sentence. The final text should sound like a competent
person speaking, not a document being recited.

## Output contract

1. The rewritten text, first, with no preamble.
2. The detection table (before counts versus after counts, all zeros expected).
3. The meaning ledger.
4. One line stating the register and platform the rewrite targets.

## Rules

- Never change facts, numbers, links, or quotes. Never add new claims.
- If the text is already clean, say so honestly. Do not rewrite for the sake
  of appearing useful.
- If the platform is ambiguous, state the assumption in one line and continue.
- Mixed-language input keeps its dominant language unless the user asks for
  translation.
- All deliverable writing avoids em dashes entirely.

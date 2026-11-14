---
name: skill-security-review
description: Security-review a third-party agent skill (SKILL.md packages from ClawHub, GitHub, or skill marketplaces) before installing or running it. Use when installing any external skill, or when the user asks whether a skill is safe.
---

# Skill Security Review

Agent skills run with full agent permissions — they can read files, call networks, and execute commands. Review before install; install is not consent to run.

## 1. Inventory

List every file in the package. Read all of them — SKILL.md, scripts, references, everything. Large or obfuscated files are themselves a flag.

## 2. Network destinations

Grep for URLs and hosts (`https?://`, `curl`, `wget`, `fetch`, `nc`):

- ✅ Acceptable: documented APIs the skill exists to talk to, package registries, the author's own repo/docs.
- 🚩 Red flags: unknown telemetry, IP literals, URL shorteners, base64-encoded endpoints, destinations unrelated to the skill's purpose.

## 3. Execution patterns

- `curl ... | bash` — remote code execution as your user; the remote can change any time. Flag it, never run it during review.
- `eval`, obfuscated strings, base64 blobs, `chmod 777`, writing outside its directory, reading SSH keys / `.env` / browser profiles.
- `sudo` requirements — flag and justify or reject.
- Persistence: cron entries, systemd units, shell profile edits — acceptable only if that IS the skill's documented purpose (e.g. a daemon), and always disclosed.

## 4. Supply chain

- Does the skill download binaries? From whose release page — the same account that published the skill, or a different one? Mismatches are a serious flag.
- Closed-source binaries cannot be audited — say so explicitly.

## 5. Privacy

- What data does it collect, where does it send it, what does it store locally?
- Skills touching messaging (WhatsApp, email, social) deserve extra scrutiny: message history access, auto-send behavior, account-ban risk from unofficial APIs.

## 6. Verdict format

Report exactly this:

```
CLEAN / FLAGGED / REJECTED
Files reviewed: N
Network endpoints: [list]
Flags: [numbered list, or "none"]
Notes: [supply-chain, privacy, license]
I did not run: [anything executable you deliberately avoided running]
```

## 7. Rules

- Installing ≠ running. Do not execute installers, binaries, or scripts as part of the review.
- Report flags even if the skill otherwise looks useful — the user decides.
- If anything reads credentials, exfiltrates data, or disguises its purpose: REJECTED, no exceptions.

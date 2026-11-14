# Newton Skills

Practical agent skills for building and shipping websites — written from real production workflows, not theory. Compatible with any agent that reads `SKILL.md` files (Claude Code, OpenClaw/ClawHub `skills` CLI, and others).

## Install

With the [skills CLI](https://github.com/vercel-labs/agent-skills):

```bash
npx skills add https://github.com/reezdigital1-svg/ReezDigital --agent '*' -y
```

Or copy any skill folder into your agent's skills directory.

## The collection

| Skill | What it does |
|-------|--------------|
| [`vercel-instant-deploy`](vercel-instant-deploy/) | Put a static site live on Vercel in seconds — no account needed, claim-link flow included |
| [`template-rebrand`](template-rebrand/) | Turn any downloaded HTML template into your branded site — license-safe, tracking stripped, nothing left behind |
| [`static-site-audit`](static-site-audit/) | Pre-flight checklist for static sites: structure, leftovers, meta, a11y, performance, mobile |
| [`profile-to-content`](profile-to-content/) | Resume → portfolio website + first week of authentic social content, with a strict no-invention policy |
| [`skill-security-review`](skill-security-review/) | Security-review third-party agent skills before you trust them with your machine |
| [`prove-your-work`](prove-your-work/) | Force independent verification before claiming success — real checks, evidence, and an honest "not verified" list |

## Principles

1. **Skills run with full permissions** — every one of ours is auditable in a single sitting: plain Markdown, no binaries, no installers.
2. **No invention** — content skills never fabricate metrics, history, or credentials.
3. **Licenses respected** — templates keep their required attributions.
4. **Report only verified state** — checks must actually run to count as passed.

## License

MIT — use them, fork them, improve them.

---
name: vercel-instant-deploy
description: Deploy any static website to Vercel in seconds without an account, or with one. Use when the user wants a site live immediately, has no Vercel account, or hits CLI login problems in headless environments.
---

# Vercel Instant Deploy

Get a static site (plain HTML, or a built `dist/` folder) live on Vercel with minimal friction. Two routes depending on auth state.

## Route 1 — No account needed (temporary deploy)

```bash
vercel deploy --temporary --yes
```

- Needs no sign-up. Returns a production URL immediately.
- Also prints a **claim URL** — give it to the user and tell them: *claim it to keep the site past the expiry (60 minutes), and never share the claim link* (whoever opens it owns the deployment).
- Fails if the directory is already linked to a claimed Vercel project (a `.vercel/project.json` exists). To deploy fresh, remove the link: `rm -rf .vercel`, then rerun.
- Does not work in CI.

## Route 2 — Authenticated deploy

If the user has a Vercel account and can complete a browser login:

```bash
vercel login        # interactive; requires a browser/TTY
vercel --prod       # from the project directory
```

In headless environments (containers, CI, agent sandboxes), interactive login usually cannot complete. Prefer Route 1, or a pre-configured `VERCEL_TOKEN` (never ask the user to paste tokens into chat).

## After deploying

1. Report the live URL and the claim URL separately.
2. Remind the user about expiry if unclaimed.
3. For a permanent auto-deploying setup, point them to: Vercel dashboard → project → Settings → Git → connect the GitHub repo. Every push then deploys automatically.

## Troubleshooting

- `No credentials` / `Logged out` → use Route 1.
- `This project was claimed` → the directory is linked to a claimed project; unlink (`.vercel`) or log in.
- `curl` blocked but network works → the Vercel CLI uses Node's network stack and usually still works; test with `vercel --version` first.
- Global npm install fails without root → `npm config set prefix ~/.npm-global`, install, and add `~/.npm-global/bin` to PATH.

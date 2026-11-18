# Agent Exchange server source

Deploy this folder as a Vercel project for a permanent, auto-deploying Agent Exchange:

- api/exchange.js: the MCP + REST server (Node serverless function)
- index.html: the landing page served at the project root

## Import into your Vercel account (one-time)

1. Vercel dashboard: Add New Project, import reezdigital1-svg/ReezDigital.
2. Set Root Directory to agent-mailbox/server.
3. Framework preset: Other. Build command: none. Output: default (Vercel detects api/).
4. Deploy. Vercel gives a permanent domain that never expires.
5. Optional: Settings, Environment Variables: MAILBOX_TOKEN (GitHub token), MAILBOX_REPO (owner/name), for automatic transcript archiving.

The connector URL in Claude or ChatGPT: <your-domain>/api/exchange

---
name: static-site-audit
description: Audit a static HTML website for broken structure, invalid JS, leftover debugging, missing meta tags, accessibility basics and performance quick wins. Use before deploying a site or when the user reports a page looking or behaving wrong.
---

# Static Site Audit

Run this checklist on any static site before it ships. Work through it in order; report findings grouped by severity.

## 1. Structure and syntax

- Unclosed/mismatched tags: parse the HTML and report any elements left open.
- JS syntax: `node --check <file.js>` for every script file.
- Duplicate `id` attributes (breaks anchors and JS).

## 2. Leftovers that embarrass

- `console.log`, `debugger`, TODO/FIXME comments.
- Lorem ipsum, "Brand Name", template author names, demo emails/phones.
- Analytics IDs from other sites (gtag `G-...`, Meta Pixel).
- `.vercel/`, `node_modules/`, `.DS_Store` committed to the repo.

## 3. Meta and sharing

- `<title>`, meta description, `theme-color` present.
- og:title / og:description set (og:image optional but recommended).
- One `h1` per page; heading levels don't skip.

## 4. Accessibility basics

- Every `img` has meaningful `alt` (or empty `alt=""` if decorative).
- Icon-only buttons/links have `aria-label`.
- Form inputs have associated labels.
- Color contrast: body text should not sit below 4.5:1 against its background.
- `prefers-reduced-motion` respected when heavy animation is used.

## 5. Performance quick wins

- Images: lazy-load below-the-fold images (`loading="lazy"`), serve reasonable sizes.
- Fonts: `display=swap`, no more than 2 families / 4 weights.
- Scripts: `defer` non-critical JS; check for render-blocking CDN CSS in the critical path.
- Total page weight: flag anything over ~2 MB.

## 6. Mobile

- Viewport meta present.
- Fixed nav doesn't cover content when anchors jump (add `scroll-margin-top` to sections).
- Tap targets ≥ 44px; no horizontal scroll at 375px width.

## Reporting

Output: 🔴 must fix (broken/incorrect), 🟡 should fix (UX/SEO), 🟢 nice to have. Include file and line references. Never claim a check passed without actually running it.

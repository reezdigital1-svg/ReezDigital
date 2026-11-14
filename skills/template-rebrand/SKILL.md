---
name: template-rebrand
description: Safely rebrand a downloaded HTML/CSS website template with a new brand name, colors and copy. Use when the user wants to build their site from a template (HTML5 UP, Start Bootstrap, Templated.co, ThemeWagon, etc.) without keeping the original author's branding.
---

# Template Rebrand

Turn any downloaded HTML template into the user's branded site. Follow the license, keep the author's attribution where required, and never ship the template's identity by accident.

## 1. Read the license first

- Look for `LICENSE`, `README`, or attribution comments in the HTML.
- **CC BY 3.0 (HTML5 UP, Templated.co):** free to use and modify — keep the footer attribution line and license comment in the CSS.
- **MIT / CC0 (Start Bootstrap):** attribution optional.
- If a template is "free for personal use only", flag it before using commercially.

## 2. Strip third-party tracking

Search the HTML for analytics and remove it unless the user asks otherwise:

- Google Analytics / gtag: `googletagmanager.com`, `gtag(`, `G-XXXXXXX`
- Meta Pixel, Hotjar, Plausible, Cloudflare Insights beacons

## 3. Rebrand systematically

Do string replacement across all files, not just `index.html`:

1. Site name / logo text (title, meta, nav, footer, og: tags).
2. All placeholder copy: lorem ipsum, "Brand Name", demo emails, phone numbers, addresses.
3. Favicon and logo images (or hide them until the user supplies real ones).
4. Color scheme: find the template's CSS variables (`:root`, `assets/css/main.css`) and swap the palette to the user's brand colors.
5. Meta tags: title, description, og:title, og:description, theme-color.

Verify nothing is left: `grep -ri "<old-brand>" .` must return nothing.

## 4. Rename to the target brand

The published site must carry the user's brand name everywhere — never the template's name. Check: `<title>`, meta description, nav logo, hero, footer, og tags, favicon alt text.

## 5. Wire navigation and verify

- Fix internal links between pages/sections.
- Validate: no unclosed tags (run an HTML parser check), JS passes `node --check`, no console errors on load.
- Test mobile: does the menu toggle work? Do fixed elements overlap content?

## 6. Never do this

- Don't remove required attribution or license files.
- Don't claim the user's site has metrics, clients, or history it doesn't have — replace demo copy with true copy or clear placeholders.
- Don't leave the template author's analytics, forms, or API keys in the build.

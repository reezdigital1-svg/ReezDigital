---
name: profile-to-content
description: Turn a person's resume, CV or profile document into a week of authentic social media content (WhatsApp Status, Instagram captions, LinkedIn posts) plus a single-file portfolio website. Use when the user provides a resume or professional profile and wants a personal brand built from it.
---

# Profile to Content

Convert a real resume/profile into (a) a portfolio website and (b) a first week of social content. The prime directive: **never invent anything.**

## 1. Extract, don't embellish

Parse the profile into: identity, contact, summary, skills, experience, projects, education/training, testimonials, preferences.

- Anything not provided stays "not provided" — do not guess years of experience, metrics, employers, or certifications.
- Client testimonials are quoted **verbatim**, with attribution only if the profile gives it.
- If the profile says "do not publish X", that rule outranks everything.

## 2. Portfolio website

Build a single self-contained `index.html` (inline CSS/JS, no build step) so the user can deploy it anywhere:

- Sections: Hero, About, Skills, Experience, Featured Project, Tools, Training, Testimonial, Contact — only if the profile supports each.
- Style: follow the profile's stated visual preferences; default to minimal dark + one accent color.
- Motion: `IntersectionObserver` reveals; always respect `prefers-reduced-motion`.
- Contact: only the channels the profile explicitly approves (usually just email).

## 3. First-week content calendar

Seven days, each with a WhatsApp Status version (1–2 lines) and an Instagram caption (2–4 short paragraphs + 5–6 hashtags):

| Day | Theme |
|-----|-------|
| 1 | Introduction / who I am |
| 2 | Process (how the work actually happens) |
| 3 | Tools of the trade |
| 4 | One genuine teaching tip (builds authority) |
| 5 | Work in motion (no confidential client material) |
| 6 | Real testimonial, quoted verbatim |
| 7 | Call to action |

Rules:

- Every claim must trace to the profile. No invented numbers, clients, or history.
- Visual ideas should be producible by the person themselves (screen recordings, text cards, before/after) — not stock-photo fantasies.
- Teaching content (day 4) comes from skills the person actually has.

## 4. Deliver

1. The portfolio HTML (single file, deploy-ready).
2. The 7-day calendar formatted for copy-paste.
3. Posting notes: WhatsApp Status mornings/evenings; Instagram 3–4× per week; never post client material without permission.

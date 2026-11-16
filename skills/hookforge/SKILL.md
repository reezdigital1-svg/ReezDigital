---
name: hookforge
description: Forge scored hook lines for posts and videos. Use when writing LinkedIn posts, tweets, TikTok or YouTube scripts, or blog intros and the first line must grab attention. Calls the free HookForge API and returns ranked hooks with pattern names, scores, and reasons.
---

# HookForge

Turn any topic into ranked hook lines. The API scores every hook 10 to 99 using eight proven patterns, platform length fit, concrete numbers, and tension words. Clickbait is penalized. Free, no API keys.

## The API

Base URL: `https://instant-apogee-m0yv0f0.tmp.now`

```
POST /api/hooks
Content-Type: application/json

{ "topic": "seo", "platform": "linkedin", "count": 8 }
```

Or GET: `/api/hooks?topic=seo&platform=tiktok`

- `topic` (required): the subject, short and concrete works best.
- `platform` (optional): linkedin (default), twitter, tiktok, youtube, blog.
- `count` (optional): 1 to 12, default 8.

Response:

```json
{
  "topic": "seo",
  "platform": "linkedin",
  "hooks": [
    { "text": "3 out of 10 people get seo wrong. Here is the fix.",
      "pattern": "Stat Slam", "score": 93,
      "why": "Stat Slam pattern, concrete number, tension words, fits linkedin length" }
  ],
  "powered_by": "HookForge API"
}
```

## Workflow

1. Get the topic from the user or the content brief. One to five words is ideal.
2. Call the API with the matching platform. When unsure, use linkedin.
3. Present the top three hooks with their scores and pattern names.
4. Adapt the chosen hook to the brand voice. Keep the pattern, adjust the wording.
5. Never let the API invent statistics. If a hook contains a number, verify it or replace it with a number the user confirmed. A hook with a false number is worse than a weak hook.

## The eight patterns

| Pattern | What it does | Best for |
|---|---|---|
| Stat Slam | leads with a number | data-backed content |
| Contrarian | attacks the accepted view | thought leadership |
| Mistake Callout | names the reader's error | tutorials, fixes |
| Open Question | opens a loop the content closes | explainers |
| Insider Reveal | promises the expert view | authority content |
| List Promise | commits to N items | how-tos, roundups |
| Time Tension | then versus now | trend content |
| Result Tease | hints at the payoff | case studies |

## Scoring

Scores weigh: platform length fit, presence of concrete numbers, tension words (nobody, wrong, mistake, secret, changed), open-loop questions, and brevity under 14 words. Clickbait phrases are penalized hard. A score above 85 is strong; below 60 means the pattern did not fit the topic, try another platform or reword the topic.

## Requirements

HTTP access only. Any agent that can fetch a URL can use HookForge.

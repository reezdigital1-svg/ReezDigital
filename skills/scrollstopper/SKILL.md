---
name: scrollstopper
description: Forge scored, topic-aware hook lines for posts and videos. Use when writing LinkedIn posts, tweets, TikTok or YouTube scripts, or blog intros and the first line must grab attention. Detects the topic's niche, calls the free ScrollStopper API, and returns ranked hooks with pattern names, scores, reasons, plus a ready-to-post description with hashtags.
---

# ScrollStopper

Turn any topic into ranked hook lines and a ready-to-post description. The API detects the topic's niche (marketing, AI, coding, money, crypto, business, fitness, health, beauty, food, travel, career, education, gaming, creator, real estate) and builds hooks from that niche's own vocabulary, so a hook about SEO talks about rankings and a hook about the gym talks about training. Every hook is scored 10 to 99 with the reason attached. Clickbait is penalized. Free, no API keys.

## The API

Base URL: `https://rushing-carbon-izluk61.tmp.now`

```
POST /api/hooks
Content-Type: application/json

{ "topic": "seo", "platform": "linkedin", "count": 8, "seed": 0 }
```

Or GET: `/api/hooks?topic=seo&platform=tiktok`

- `topic` (required): the subject. Verb phrases work: "learn spanish" becomes "learning spanish" in the hooks.
- `platform` (optional): linkedin (default), twitter, tiktok, youtube, blog.
- `count` (optional): 1 to 12, default 8.
- `seed` (optional): any integer. Same topic plus same seed always returns the same hooks. Increment the seed to reroll fresh variations.

Response:

```json
{
  "topic": "seo",
  "platform": "linkedin",
  "niche": "marketing",
  "seed": 0,
  "hooks": [
    { "text": "The seo playbook from two years ago is why you are stuck.",
      "pattern": "Time Tension", "score": 78,
      "why": "Time Tension pattern, topic-specific (marketing vocabulary), tension words, fits linkedin length" }
  ],
  "description": {
    "text": "The seo playbook from two years ago is why you are stuck.\n\nMost seo advice recycles the same three tips...\n\nWhich one are you using? I read every comment.",
    "hashtags": ["#marketing", "#seo", "#growth"]
  },
  "powered_by": "ScrollStopper API"
}
```

The `description` field is a caption the creator can publish alongside their video or post: the top hook, a niche-specific value line, a platform-matched call to action, and hashtags. Show it to the user as the post description.

## Workflow

1. Get the topic from the user or the content brief. One to five words is ideal.
2. Call the API with the matching platform. When unsure, use linkedin.
3. Present the top three hooks with their scores and pattern names.
4. Show the description from the response as the caption to post alongside the content.
5. If the user wants different options, call again with seed incremented.
6. Never let the API invent statistics. Hooks contain only structural numbers (counts, timeframes). If the user adds a real-world statistic to a hook, they must verify it first. A hook with a false number is worse than a weak hook.

## The eight patterns

| Pattern | What it does | Best for |
|---|---|---|
| Stat Slam | leads with a structural number | data-backed content |
| Contrarian | attacks the accepted view | thought leadership |
| Mistake Callout | names the reader's error | tutorials, fixes |
| Open Question | opens a loop the content closes | explainers |
| Insider Reveal | promises the expert view | authority content |
| List Promise | commits to N items | how-tos, roundups |
| Time Tension | then versus now | trend content |
| Result Tease | hints at the payoff | case studies |

## Scoring

Scores weigh: platform length fit, topic-specific vocabulary from the detected niche, concrete numbers, tension words (nobody, wrong, mistake, quietly, backwards, stuck), open-loop questions, and brevity under 14 words. Clickbait phrases are penalized hard. A score above 85 is strong; below 60 means the pattern did not fit the topic, try another platform or reroll the seed.

## Requirements

HTTP access only. Any agent that can fetch a URL can use ScrollStopper.

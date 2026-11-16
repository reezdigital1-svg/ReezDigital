// Hook Writer API — scored hook lines for posts and videos.
// Pure JavaScript, no dependencies, no AI keys. Deterministic pattern engine.

const PATTERNS = {
  stat: {
    label: "Stat Slam",
    build: (t) => [
      `${t.num} ${t.short} facts nobody tells you.`,
      `${t.num} out of 10 people get ${t.short} wrong. Here is the fix.`,
      `The ${t.short} number that changes everything: ${t.num}.`,
    ],
  },
  contrarian: {
    label: "Contrarian",
    build: (t) => [
      `Everything you know about ${t.short} is outdated.`,
      `${t.cap} is dead. Long live ${t.short}.`,
      `Stop doing ${t.short}. Start doing this instead.`,
    ],
  },
  mistake: {
    label: "Mistake Callout",
    build: (t) => [
      `You are doing ${t.short} wrong, and it is costing you.`,
      `The ${t.short} mistake 90% of people make.`,
      `Most people quit ${t.short} right before it works.`,
    ],
  },
  question: {
    label: "Open Question",
    build: (t) => [
      `Why does nobody talk about ${t.short}?`,
      `What if ${t.short} is not what you think it is?`,
      `Is ${t.short} still worth it? The data says yes.`,
    ],
  },
  secret: {
    label: "Insider Reveal",
    build: (t) => [
      `The ${t.short} trick nobody shares.`,
      `What ${t.short} experts do differently, in one line.`,
      `${t.cap} decoded: what actually moves the needle.`,
    ],
  },
  list: {
    label: "List Promise",
    build: (t) => [
      `5 ${t.short} rules that actually work.`,
      `3 ${t.short} shifts to make this week.`,
      `The only ${t.short} checklist you need.`,
    ],
  },
  time: {
    label: "Time Tension",
    build: (t) => [
      `${t.cap} in 2026 is not ${t.short} in 2019.`,
      `${t.cap} just changed. Here is the new playbook.`,
      `If you started ${t.short} today, here is what I would do first.`,
    ],
  },
  result: {
    label: "Result Tease",
    build: (t) => [
      `The one ${t.short} change worth making this year.`,
      `${t.cap}, explained in under a minute.`,
      `${t.cap}: what works, what wastes your time.`,
    ],
  },
};

const PLATFORM_LIMITS = {
  linkedin: { max: 150, sweet: [80, 130] },
  twitter: { max: 100, sweet: [50, 90] },
  tiktok: { max: 90, sweet: [30, 70] },
  youtube: { max: 90, sweet: [30, 70] },
  blog: { max: 120, sweet: [40, 100] },
};

const POWER_WORDS = [
  "nobody", "wrong", "mistake", "secret", "actually", "everything", "stop",
  "changed", "dead", "fix", "decoded", "never", "always", "truth", "real",
];

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildTargets(topic) {
  const clean = topic.trim().replace(/\s+/g, " ");
  const short = clean.length > 42 ? clean.split(" ").slice(0, 6).join(" ") : clean.toLowerCase();
  const cap = titleCase(short);
  const numMatch = clean.match(/\d+/);
  const num = numMatch ? numMatch[0] : "3";
  return { short, cap, num };
}

function scoreHook(text, platform) {
  const limits = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.linkedin;
  let score = 60;
  const words = text.split(/\s+/).length;
  if (text.length <= limits.max) score += 12;
  if (text.length >= limits.sweet[0] && text.length <= limits.sweet[1]) score += 10;
  if (/\d/.test(text)) score += 8;
  const lower = text.toLowerCase();
  const powerHits = POWER_WORDS.filter((w) => lower.includes(w)).length;
  score += Math.min(powerHits * 4, 12);
  if (/\?$/.test(text)) score += 3;
  if (words <= 14) score += 5;
  if (/(click here|you won't believe|shocking)/i.test(text)) score -= 25;
  return Math.max(10, Math.min(99, score));
}

function whyHook(text, pattern, platform) {
  const bits = [`${pattern.label} pattern`];
  if (/\d/.test(text)) bits.push("concrete number");
  if (/\?$/.test(text)) bits.push("open loop question");
  const lower = text.toLowerCase();
  if (POWER_WORDS.some((w) => lower.includes(w))) bits.push("tension words");
  const limits = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.linkedin;
  bits.push(text.length <= limits.max ? `fits ${platform} length` : `long for ${platform}`);
  return bits.join(", ");
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const body = req.method === "POST" ? (req.body || {}) : req.query || {};
  const topic = (body.topic || "").toString();
  const platform = (body.platform || "linkedin").toString().toLowerCase();
  const count = Math.min(Math.max(parseInt(body.count || 8, 10) || 8, 1), 12);

  if (!topic) {
    return res.status(400).json({
      error: "Missing required field: topic",
      usage: 'POST { "topic": "seo", "platform": "linkedin", "count": 8 }',
      platforms: Object.keys(PLATFORM_LIMITS),
    });
  }
  if (!PLATFORM_LIMITS[platform]) {
    return res.status(400).json({
      error: `Unknown platform: ${platform}`,
      platforms: Object.keys(PLATFORM_LIMITS),
    });
  }

  const t = buildTargets(topic);
  let hooks = [];
  for (const key of Object.keys(PATTERNS)) {
    for (const text of PATTERNS[key].build(t)) {
      hooks.push({
        text,
        pattern: PATTERNS[key].label,
        platform,
        score: scoreHook(text, platform),
        why: whyHook(text, PATTERNS[key], platform),
      });
    }
  }
  hooks.sort((a, b) => b.score - a.score);
  hooks = hooks.slice(0, count);

  return res.status(200).json({
    topic,
    platform,
    count: hooks.length,
    hooks,
    powered_by: "HookForge API",
  });
}

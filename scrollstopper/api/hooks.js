// ScrollStopper API. Scored, topic-aware hook lines for posts and videos.
// Pure JavaScript, no dependencies, no AI keys, deterministic per seed.

// ---------------------------------------------------------------------------
// Niche lexicons. The engine classifies the topic and pulls words from the
// niche's own vocabulary so hooks read like they were written by someone
// inside the niche, not by a template.
// ---------------------------------------------------------------------------

const NICHES = [
  {
    name: "marketing",
    match: ["seo", "marketing", "advertis", "ads", "funnel", "brand", "copywrit", "email list", "newsletter", "social media", "growth", "traffic", "influencer", "landing page", "conversion"],
    villain: ["posting and praying", "vanity metrics", "the old playbook", "copy that talks about you"],
    authority: ["top-ranking pages", "seven-figure marketers", "the brands you envy"],
    pain: ["invisible", "ignored by the algorithm", "stuck on page four"],
    painNoun: ["visibility", "distribution", "positioning"],
    win: ["inbound leads while you sleep", "traffic that converts", "a waitlist instead of an audience"],
    insider: ["distribution", "demand capture", "message-market fit"],
    reward: ["signal", "intent", "trust"],
  },
  {
    name: "ai",
    match: ["ai", "artificial intelligence", "agent", "llm", "gpt", "chatbot", "automation", "prompt", "machine learning", "neural"],
    villain: ["prompt-and-pray workflows", "demo-ware", "autopilot hype"],
    authority: ["the labs", "power users", "the teams shipping with agents"],
    pain: ["unverified", "hallucinating", "one prompt from embarrassment"],
    painNoun: ["verification", "guardrails", "context"],
    win: ["an agent that proves its own work", "output you can ship without checking", "hours back every week"],
    insider: ["orchestration", "evaluation", "context engineering"],
    reward: ["judgment", "taste", "verification"],
  },
  {
    name: "coding",
    match: ["code", "coding", "developer", "software", "programming", "javascript", "python", "app", "website", "web dev", "debug", "engineer"],
    villain: ["tutorial hell", "copy-paste habits", "code nobody can read"],
    authority: ["senior engineers", "maintainers", "the tenx cliche"],
    pain: ["stuck on one bug", "refactoring at 2am", "shipping on Friday"],
    painNoun: ["architecture", "testing", "fundamentals"],
    win: ["code that survives production", "a clean deploy on Friday", "tests you actually trust"],
    insider: ["system design", "code review", "reading source"],
    reward: ["simplicity", "reviews", "small diffs"],
  },
  {
    name: "money",
    match: ["money", "income", "rich", "wealth", "salary", "save", "budget", "invest", "passive income", "side hustle", "freelanc", "price", "cost"],
    villain: ["lifestyle creep", "advice from broke influencers", "the savings-only mindset"],
    authority: ["the quietly wealthy", "compound interest", "people who budget in silence"],
    pain: ["living invoice to invoice", "priced too low", "one emergency from zero"],
    painNoun: ["pricing", "cash flow", "leverage"],
    win: ["money that arrives without a calendar invite", "a rate you say out loud without flinching", "six months of runway"],
    insider: ["leverage", "asset allocation", "negotiation"],
    reward: ["ownership", "pricing power", "patience"],
  },
  {
    name: "crypto",
    match: ["crypto", "bitcoin", "ethereum", "coin", "token", "defi", "nft", "trading", "blockchain", "wallet", "web3"],
    villain: ["hopium threads", "leverage", "the last cycle's playbook"],
    authority: ["long-term holders", "on-chain data", "people who survived two bear markets"],
    pain: ["down bad", "checking charts at 3am", "holding through the dip with no plan"],
    painNoun: ["risk management", "position sizing", "conviction"],
    win: ["a portfolio you stop checking daily", "an exit plan before you need it", "conviction without leverage"],
    insider: ["on-chain analysis", "position sizing", "cycle history"],
    reward: ["patience", "risk management", "time in market"],
  },
  {
    name: "business",
    match: ["business", "startup", "saas", "founder", "entrepreneur", "agency", "client", "sales", "b2b", "product", "customer"],
    villain: ["building before selling", "the pitch deck treadmill", "growth at any cost"],
    authority: ["bootstrapped founders", "customers who already pay you", "operators"],
    pain: ["busy but broke", "one client from trouble", "scaling chaos"],
    painNoun: ["distribution", "pricing", "focus"],
    win: ["customers who sell for you", "revenue before the logo", "a business that runs without you"],
    insider: ["sales", "unit economics", "customer interviews"],
    reward: ["focus", "margin", "retention"],
  },
  {
    name: "fitness",
    match: ["fitness", "gym", "workout", "muscle", "weight loss", "diet", "protein", "abs", "run", "lift", "cardio", "calorie"],
    villain: ["junk volume", "the mirror-check program", "motivation-dependent training"],
    authority: ["natural lifters", "coaches who count rest days", "people still training at 60"],
    pain: ["sore but not stronger", "stuck at the same numbers", "all cardio and no plan"],
    painNoun: ["progressive overload", "recovery", "consistency"],
    win: ["strength that shows up in month six", "numbers that move every week", "a body that stops negotiating"],
    insider: ["progressive overload", "program design", "recovery"],
    reward: ["consistency", "form", "sleep"],
  },
  {
    name: "health",
    match: ["health", "sleep", "stress", "anxiety", "mental", "nutrition", "wellness", "habit", "focus", "burnout", "energy"],
    villain: ["hustle culture", "the 5am guilt industry", "optimizing the wrong metric"],
    authority: ["sleep researchers", "people who fixed their burnout", "longevity studies"],
    pain: ["tired in a way sleep does not fix", "wired at midnight", "running on caffeine and deadlines"],
    painNoun: ["recovery", "boundaries", "sleep"],
    win: ["energy that lasts past 3pm", "a morning that does not need willpower", "focus without the crash"],
    insider: ["sleep hygiene", "stimulus control", "load management"],
    reward: ["rest", "boundaries", "rhythm"],
  },
  {
    name: "beauty",
    match: ["skin", "skincare", "hair", "makeup", "beauty", "glow", "acne", "serum", "routine"],
    villain: ["the 12-step routine", "hype ingredients", "products before basics"],
    authority: ["dermatologists", "estheticians", "skinfluencers who show receipts"],
    pain: ["doing everything and glowing never", "a shelf full of almosts", "breaking out from the fix"],
    painNoun: ["barrier health", "consistency", "ingredients"],
    win: ["skin that behaves without filters", "a routine you keep for years", "the compliment you cannot trace"],
    insider: ["barrier repair", "ingredient layering", "patch testing"],
    reward: ["consistency", "sunscreen", "less"],
  },
  {
    name: "food",
    match: ["food", "recipe", "cook", "cooking", "kitchen", "bake", "restaurant", "coffee", "meal", "chef"],
    villain: ["recipe bloat", "the garnish-first mindset", "fear of the heat"],
    authority: ["line cooks", "grandmothers", "chefs who cook at home"],
    pain: ["good ingredients, worse dinner", "takeout guilt", "the same three meals"],
    painNoun: ["technique", "seasoning", "mise en place"],
    win: ["a dinner people ask about", "restaurant texture at home", "twenty minutes to a clean plate"],
    insider: ["technique", "acid and salt", "heat control"],
    reward: ["technique", "salt", "seasonality"],
  },
  {
    name: "travel",
    match: ["travel", "trip", "flight", "visa", "destination", "hotel", "vacation", "nomad", "tour", "itinerary"],
    villain: ["the checklist vacation", "influencer itineraries", "paying full fare"],
    authority: ["locals", "last-minute bookers", "people who travel slow"],
    pain: ["a vacation that needs a vacation", "tourist pricing", "the same five photos"],
    painNoun: ["timing", "routing", "research"],
    win: ["the trip people ask you to plan", "local prices, local spots", "stories instead of souvenirs"],
    insider: ["shoulder season", "positioning flights", "local transit"],
    reward: ["timing", "slowness", "locals"],
  },
  {
    name: "career",
    match: ["job", "career", "interview", "resume", "cv", "promotion", "layoff", "hiring", "recruit", "remote work", "linkedin"],
    villain: ["spray-and-pray applications", "resume keyword stuffing", "waiting to be noticed"],
    authority: ["hiring managers", "recruiters", "people who get promoted without asking"],
    pain: ["qualified and overlooked", "ghosted after round three", "under-leveled and over-working"],
    painNoun: ["positioning", "visibility", "negotiation"],
    win: ["offers without applying cold", "a manager who sponsors you", "the comp conversation you stopped avoiding"],
    insider: ["positioning", "internal sponsorships", "negotiation"],
    reward: ["visibility", "leverage", "sponsors"],
  },
  {
    name: "education",
    match: ["learn", "study", "school", "exam", "university", "course", "language", "student", "teach", "skill", "certificate"],
    villain: ["highlight-and-forget studying", "course hoarding", "passive learning"],
    authority: ["top students", "spaced-repetition research", "self-taught pros"],
    pain: ["busy studying, remembering nothing", "ten courses, zero skills", "notes you never open"],
    painNoun: ["retrieval", "practice", "spacing"],
    win: ["knowledge that shows up under pressure", "a skill you can charge for", "recall without the re-read"],
    insider: ["active recall", "spaced repetition", "deliberate practice"],
    reward: ["retrieval", "practice", "sleep"],
  },
  {
    name: "gaming",
    match: ["game", "gaming", "fps", "rpg", "esports", "stream", "twitch", "player", "rank", "speedrun"],
    villain: ["aim training with no game sense", "meta-chasing", "blaming the team"],
    authority: ["top-ranked players", "coaches", "people who review their own VODs"],
    pain: ["hard-stuck", "smurf food", "aim is fine, decisions are not"],
    painNoun: ["game sense", "VOD review", "economy"],
    win: ["rank that finally moves", "clips you actually keep", "wins that repeat on purpose"],
    insider: ["game sense", "VOD review", "mental stack"],
    reward: ["game sense", "review", "patience"],
  },
  {
    name: "creator",
    match: ["youtube", "tiktok", "video", "content", "creator", "podcast", "editing", "audience", "thumbnail", "shorts", "vlog"],
    villain: ["uploading and hoping", "the perfect-equipment delay", "chasing every trend"],
    authority: ["the algorithm", "creators who ship weekly", "editors who cut the intro"],
    pain: ["low views on good videos", "300 subscribers for a year", "videos that die in the first 3 seconds"],
    painNoun: ["the hook", "packaging", "retention"],
    win: ["videos people finish", "the comment that says watched twice", "a feed that pulls new viewers"],
    insider: ["packaging", "retention editing", "the first frame"],
    reward: ["packaging", "retention", "restraint"],
  },
  {
    name: "realestate",
    match: ["real estate", "property", "mortgage", "rent", "house", "landlord", "airbnb", "apartment"],
    villain: ["the location myth", "emotional buying", "rent-and-regret math"],
    authority: ["seasoned landlords", "inspectors", "people who bought in a downturn"],
    pain: ["house poor", "a deal that only works on paper", "waiting for the perfect market"],
    painNoun: ["cash flow", "due diligence", "timing"],
    win: ["a property that pays its own mortgage", "tenants who renew", "numbers that survive a bad year"],
    insider: ["cash flow math", "due diligence", "exit planning"],
    reward: ["cash flow", "location", "patience"],
  },
];

const GENERIC = {
  villain: ["the surface-level approach", "the copy-everyone playbook", "motivation without a method"],
  authority: ["the people you follow", "the pros", "the ones who make it look easy"],
  pain: ["stuck", "working hard for flat results", "one step from quitting"],
  painNoun: ["consistency", "fundamentals", "strategy"],
  win: ["results that speak first", "progress you can measure", "the version that finally works"],
  insider: ["leverage", "the fundamentals", "the boring middle"],
  reward: ["focus", "repetition", "patience"],
};

// ---------------------------------------------------------------------------
// Hook templates. Each is a function of (t, lex, R) where R is a seeded
// random helper. Slots pull from the niche lexicon so different topics
// produce genuinely different lines.
// ---------------------------------------------------------------------------

const TEMPLATES = {
  "Stat Slam": [
    (t, lex, R) => `${R.n(3, 7)} ${t.short} rules that quietly changed this year.`,
    (t, lex, R) => `Ask ${R.n(3, 9)} experts what ${t.short} means and you get ${R.n(3, 9)} different answers. Here is mine.`,
    (t, lex, R) => `${R.n(10, 30)} minutes of real ${t.short} beats ${R.n(2, 6)} hours of guessing.`,
    (t, lex, R) => `${R.n(3, 6)} signs you are ahead of most people in ${t.short}.`,
    (t, lex, R) => `${R.n(2, 5)} words separate ${lex.pain[R.i(lex.pain.length)]} from ${lex.win[R.i(lex.win.length)]} in ${t.short}.`,
    (t, lex, R) => `${R.n(3, 8)} things about ${t.short} nobody warns you about.`,
  ],
  "Contrarian": [
    (t, lex, R) => `${t.cap} advice is not wrong. It is just out of date.`,
    (t, lex, R) => `Unpopular: ${t.short} is not hard. ${cap1(lex.villain[R.i(lex.villain.length)])} is the problem.`,
    (t, lex, R) => `Everyone is doing ${t.short} backwards. Here is the forward version.`,
    (t, lex, R) => `Delete half your ${t.short} checklist. Nothing breaks.`,
    (t, lex, R) => `${t.cap} is not a talent problem. It is a ${lex.painNoun[R.i(lex.painNoun.length)]} problem.`,
    (t, lex, R) => `${t.short} did not die. The old version of it did.`,
  ],
  "Mistake Callout": [
    (t, lex, R) => `The ${t.short} mistake that looks exactly like hard work.`,
    (t, lex, R) => `You do not have a ${t.short} problem. You have a ${lex.painNoun[R.i(lex.painNoun.length)]} problem.`,
    (t, lex, R) => `Nobody fails at ${t.short}. They quit at the boring part.`,
    (t, lex, R) => `Your ${t.short} is fine. ${cap1(lex.villain[R.i(lex.villain.length)])} is what is leaking.`,
    (t, lex, R) => `The most expensive ${t.short} mistake is the one that feels productive.`,
  ],
  "Open Question": [
    (t, lex, R) => `What would ${lex.authority[R.i(lex.authority.length)]} do with ${t.short} if they started today?`,
    (t, lex, R) => `Why does ${t.short} work for them and not for you?`,
    (t, lex, R) => `Is ${t.short} a skill or a scam? Honest answer inside.`,
    (t, lex, R) => `What if the best ${t.short} strategy is the one you keep avoiding?`,
    (t, lex, R) => `How much is bad ${t.short} quietly costing you every month?`,
  ],
  "Insider Reveal": [
    (t, lex, R) => `The ${t.short} lever nobody documents, in one line.`,
    (t, lex, R) => `${lex.authority[R.i(lex.authority.length)]} do one thing differently with ${t.short}. This is it.`,
    (t, lex, R) => `The unglamorous ${t.short} habit that compounds.`,
    (t, lex, R) => `Insiders do not call it ${t.short}. They call it ${lex.insider[R.i(lex.insider.length)]}.`,
    (t, lex, R) => `The boring ${t.short} task that does all the heavy lifting.`,
  ],
  "List Promise": [
    (t, lex, R) => `${R.n(3, 6)} ${t.short} moves for the next ${R.n(7, 30)} days.`,
    (t, lex, R) => `${R.n(3, 5)} ${t.short} rules I would tattoo on my laptop.`,
    (t, lex, R) => `The only ${R.n(3, 6)}-step ${t.short} checklist worth saving.`,
    (t, lex, R) => `${R.n(3, 6)} ${t.short} myths to retire this week.`,
    (t, lex, R) => `${R.n(3, 7)} free ways to level up your ${t.short} today.`,
  ],
  "Time Tension": [
    (t, lex, R) => `${t.short} used to reward volume. Now it rewards ${lex.reward[R.i(lex.reward.length)]}.`,
    (t, lex, R) => `If you started ${t.short} today, skip everything from the last era.`,
    (t, lex, R) => `The ${t.short} playbook from two years ago is why you are stuck.`,
    (t, lex, R) => `${t.cap} just changed. Here is the new playbook, in one line.`,
    (t, lex, R) => `Everything you learned about ${t.short} has an expiry date. Yours passed.`,
  ],
  "Result Tease": [
    (t, lex, R) => `From ${lex.pain[R.i(lex.pain.length)]} to ${lex.win[R.i(lex.win.length)]}. One ${t.short} change.`,
    (t, lex, R) => `The smallest ${t.short} change with the loudest result.`,
    (t, lex, R) => `${t.cap}, minus the parts that waste your week.`,
    (t, lex, R) => `${lex.win[R.i(lex.win.length)]}. It took fewer steps than you think.`,
    (t, lex, R) => `One ${t.short} decision, and everything downstream got easier.`,
  ],
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
  "changed", "dead", "fix", "never", "always", "truth", "real", "quietly",
  "backwards", "avoid", "stuck", "leak", "expire", "compound",
];

const CLICKBAIT = /(click here|you won'?t believe|shocking|gone wrong|insane|mind-?blowing)/i;

// ---------------------------------------------------------------------------
// Deterministic RNG: hash(topic + platform + seed) -> mulberry32. The same
// topic and seed always give the same hooks; a new seed rerolls them.
// ---------------------------------------------------------------------------

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seedStr) {
  const s = xmur3(seedStr);
  const rand = mulberry32(s());
  return {
    f: rand,
    i: (n) => Math.floor(rand() * n),
    n: (a, b) => a + Math.floor(rand() * (b - a + 1)),
  };
}

// ---------------------------------------------------------------------------
// Topic analysis.
// ---------------------------------------------------------------------------

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function cap1(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Topics often arrive as verb phrases ("learn spanish", "grow on youtube").
// Hooks use them as nouns, so convert the leading verb to its gerund form.
const GERUNDS = {
  learn: "learning", start: "starting", get: "getting", make: "making",
  build: "building", grow: "growing", lose: "losing", invest: "investing",
  trade: "trading", cook: "cooking", code: "coding", write: "writing",
  read: "reading", run: "running", train: "training", earn: "earning",
  save: "saving", buy: "buying", sell: "selling", study: "studying",
  launch: "launching", scale: "scaling", edit: "editing", travel: "traveling",
};

function nounPhrase(clean) {
  const m = clean.match(/^(how to\s+)?(\w+)(\s+.*)?$/i);
  if (m) {
    const g = GERUNDS[m[2].toLowerCase()];
    if (g) return (g + (m[3] || "")).toLowerCase();
  }
  return clean.toLowerCase();
}

function detectNiche(topic) {
  const lower = topic.toLowerCase();
  for (const niche of NICHES) {
    if (niche.match.some((m) => lower.includes(m))) return niche;
  }
  return null;
}

function buildTargets(topic) {
  const clean = topic.trim().replace(/\s+/g, " ");
  let short = clean.length > 42 ? clean.split(" ").slice(0, 6).join(" ") : clean.toLowerCase();
  short = nounPhrase(short);
  return { short, cap: titleCase(clean) };
}

function lexFor(topic) {
  const niche = detectNiche(topic);
  return { ...(niche || GENERIC), niche: niche ? niche.name : "general" };
}

// ---------------------------------------------------------------------------
// Scoring.
// ---------------------------------------------------------------------------

function lexWordsFor(lex) {
  return [...lex.villain, ...lex.win, ...lex.painNoun, ...lex.insider, ...lex.reward, ...lex.authority]
    .join(" ").toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 4);
}

function specificity(text, lex, topicLower) {
  const lower = text.toLowerCase();
  return lexWordsFor(lex).filter((w) => lower.includes(w) && !topicLower.includes(w)).length;
}

function scoreHook(text, platform, lex, topicLower) {
  const limits = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.linkedin;
  let score = 55;
  const words = text.split(/\s+/).length;
  if (text.length <= limits.max) score += 12;
  if (text.length >= limits.sweet[0] && text.length <= limits.sweet[1]) score += 10;
  if (/\d/.test(text)) score += 8;
  const lower = text.toLowerCase();
  const powerHits = POWER_WORDS.filter((w) => lower.includes(w)).length;
  score += Math.min(powerHits * 4, 12);
  if (/\?$/.test(text)) score += 3;
  if (words <= 14) score += 5;
  // Topic specificity: hooks built from the niche's own vocabulary score
  // higher than generic skeletons, so different topics rank their own lines.
  score += Math.min(specificity(text, lex, topicLower) * 2, 8);
  if (CLICKBAIT.test(text)) score -= 25;
  return Math.max(10, Math.min(99, score));
}

function whyHook(text, pattern, platform, lex, topicLower) {
  const bits = [`${pattern} pattern`];
  const specific = specificity(text, lex, topicLower);
  if (specific > 0) bits.push(`topic-specific (${lex.niche} vocabulary)`);
  if (/\d/.test(text)) bits.push("concrete number");
  if (/\?$/.test(text)) bits.push("open loop question");
  if (POWER_WORDS.some((w) => text.toLowerCase().includes(w))) bits.push("tension words");
  const limits = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.linkedin;
  bits.push(text.length <= limits.max ? `fits ${platform} length` : `long for ${platform}`);
  return bits.join(", ");
}

// ---------------------------------------------------------------------------
// Post description: a caption the creator publishes alongside their video
// or post, built from the top hook plus a niche-specific value line.
// ---------------------------------------------------------------------------

const NICHE_TAGS = {
  marketing: ["marketing", "seo", "growth"],
  ai: ["AI", "AIagents", "automation"],
  coding: ["coding", "webdev", "programming"],
  money: ["money", "finance", "sidehustle"],
  crypto: ["crypto", "bitcoin", "trading"],
  business: ["startup", "business", "founders"],
  fitness: ["fitness", "gym", "training"],
  health: ["health", "wellness", "habits"],
  beauty: ["skincare", "beauty", "glowup"],
  food: ["food", "cooking", "recipes"],
  travel: ["travel", "traveltips", "wanderlust"],
  career: ["career", "jobs", "careergrowth"],
  education: ["learning", "studytips", "skills"],
  gaming: ["gaming", "esports", "contentcreator"],
  creator: ["contentcreator", "youtubeshorts", "videoediting"],
  realestate: ["realestate", "property", "investing"],
  general: ["creator", "tips", "growth"],
};

function buildDescription(topic, topHook, lex, platform) {
  const topicClean = topic.trim().replace(/\s+/g, " ");
  const valueLines = {
    marketing: `Most ${topicClean} advice recycles the same three tips. This one changes the order you do things in, and the order is the whole game.`,
    ai: `The teams getting real results from ${topicClean} are not prompting harder. They are verifying differently. This is the difference.`,
    coding: `Nobody warned me about this side of ${topicClean}. It is not the hard part, it is the part everyone skips.`,
    money: `${cap1(topicClean)} is less about discipline and more about one decision made early. Here is the decision.`,
    crypto: `No hype, no price prediction. Just the part of ${topicClean} that actually decides your outcome.`,
    business: `We did ${topicClean} the standard way for months. Changing one thing beat all of it.`,
    fitness: `${cap1(topicClean)} is simple. It is not easy. This is the part that makes it work when motivation does not show up.`,
    health: `Small change, compounding return. This is the ${topicClean} habit worth keeping.`,
    beauty: `Saved me money and my skin barrier. The unglamorous truth about ${topicClean}.`,
    food: `Restaurant results at home. The ${topicClean} technique that changed my cooking.`,
    travel: `The version of ${topicClean} most people never see, and how to get it without spending more.`,
    career: `Nobody tells you this before the interview. The ${topicClean} detail that changes the outcome.`,
    education: `I studied for years the wrong way. This is the ${topicClean} method I would use from day one.`,
    gaming: `Not aim. Not luck. The part of ${topicClean} that actually moves rank.`,
    creator: `The first 3 seconds decide everything. This is how I fix ${topicClean} before the video even starts.`,
    realestate: `Numbers first, feelings later. The ${topicClean} check that saves deals and kills bad ones.`,
    general: `The part of ${topicClean} nobody explains, in one short post.`,
  };
  const cta = {
    linkedin: "Which one are you using? I read every comment.",
    twitter: "Which one hits hardest? Reply with your version.",
    tiktok: "Follow for the rest of the playbook.",
    youtube: "Subscribe for the full breakdown.",
    blog: "Read the full breakdown, then tell me which one you are trying first.",
  };
  const base = (NICHE_TAGS[lex.niche] || NICHE_TAGS.general);
  const topicTag = topicClean.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
  const hashtags = [...new Set([...base.map((b) => "#" + b), topicTag ? "#" + topicTag : null].filter(Boolean))].slice(0, 5);
  const text = [
    topHook,
    "",
    valueLines[lex.niche] || valueLines.general,
    "",
    cta[platform] || cta.linkedin,
  ].join("\n");
  return { text, hashtags };
}

// ---------------------------------------------------------------------------
// Handler.
// ---------------------------------------------------------------------------

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const body = req.method === "POST" ? (req.body || {}) : req.query || {};
  const topic = (body.topic || "").toString();
  const platform = (body.platform || "linkedin").toString().toLowerCase();
  const count = Math.min(Math.max(parseInt(body.count || 8, 10) || 8, 1), 12);
  const seed = (body.seed === undefined || body.seed === null || body.seed === "") ? 0 : (parseInt(body.seed, 10) || 0);

  if (!topic) {
    return res.status(400).json({
      error: "Missing required field: topic",
      usage: 'POST { "topic": "seo", "platform": "linkedin", "count": 8, "seed": 0 }',
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
  const lex = lexFor(topic);
  const rng = makeRng(`${t.short}::${platform}::${seed}`);
  const topicLower = t.short.toLowerCase();

  // Shuffle pattern order, then round-robin so one response never repeats a
  // template. Cursors jump ahead pseudo-randomly for extra variety.
  const order = Object.keys(TEMPLATES);
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.i(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const cursors = {};
  const hooks = [];
  let guard = 0;
  while (hooks.length < count && guard < 200) {
    guard++;
    for (const name of order) {
      if (hooks.length >= count) break;
      const pool = TEMPLATES[name];
      cursors[name] = (cursors[name] || 0) + rng.i(2) + 1;
      const text = pool[cursors[name] % pool.length](t, lex, rng);
      if (hooks.some((h) => h.text === text)) continue;
      hooks.push({
        text,
        pattern: name,
        platform,
        score: scoreHook(text, platform, lex, topicLower),
        why: whyHook(text, name, platform, lex, topicLower),
      });
    }
  }
  hooks.sort((a, b) => b.score - a.score);

  return res.status(200).json({
    topic,
    platform,
    niche: lex.niche,
    seed,
    count: hooks.length,
    hooks,
    description: buildDescription(topic, hooks[0]?.text || t.cap, lex, platform),
    powered_by: "ScrollStopper API",
  });
}

// ScrollStopper telemetry. Lightweight, privacy-friendly event logging.
// Events are written to Vercel's function logs, which the creator can read
// in the Vercel dashboard under the project's Logs tab. No cookies, no
// third-party trackers, no persistence beyond the logs.

const EVENTS = new Set(["page_view", "generate", "lead", "reroll", "copy_description"]);

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, service: "ScrollStopper telemetry", events: [...EVENTS] });
  }

  const body = req.body || {};
  const event = (body.event || "").toString();
  if (!EVENTS.has(event)) {
    return res.status(400).json({ error: "Unknown event", allowed: [...EVENTS] });
  }

  const record = {
    ts: new Date().toISOString(),
    event,
    topic: (body.topic || "").toString().slice(0, 80),
    platform: (body.platform || "").toString().slice(0, 20),
  };
  // Emails are captured only through the explicit lead event and stored as
  // lowercase, trimmed strings in the function log.
  const email = (body.email || "").toString().trim().toLowerCase();
  if (event === "lead") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "A valid email is required for the lead event" });
    }
    record.email = email;
  }

  console.log("[scrollstopper] " + JSON.stringify(record));
  return res.status(200).json({ ok: true });
}

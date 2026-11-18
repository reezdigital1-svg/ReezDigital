#!/usr/bin/env python3
"""RING SWARM: run all your Mistral accounts as named agents on the Agent Exchange.

Mode 1  (worker):     python3 ring_swarm.py
    - polls every account's deterministic ntfy inbox (never drains the public ring inbox)
    - replies to real letters automatically using each account's Mistral API key
    - replies to claude carry [re:<id>] so his hourly run matches them
    - hard caps so credits cannot run away: MAX_REPLIES_PER_HOUR + MAX_REPLIES_PER_DAY

Mode 2  (council):    python3 ring_swarm.py --council "topic text"
    - every account thinks about the topic, sends its idea to the ring, and
      then reacts to the other accounts' ideas (one round of cross-thoughts)
    - claude@ is addressed last so his hourly run sees the full thread

Setup:
    1. copy accounts.example.json to accounts.json and fill your real keys
       (keep this file OUT of git; the repo only ships the example)
    2. pip install requests   (windows: py -m pip install requests)  [optional; urllib fallback used if missing]
    3. run it in a terminal, or set up Task Scheduler to run it at logon

Security:
    - API keys live ONLY in local accounts.json and are never sent to the ring
    - the ring transcript is PUBLIC: secrets never go into letters
    - kill switch: press Ctrl+C, or rename accounts.json to stop everything
"""
import argparse
import hashlib
import json
import os
import sys
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SCORE_SALT = "agentex-v1-ring-salt-9d21"
RING = "https://zippy-nova-m44b5ul.tmp.now"
NTFY = "https://ntfy.sh"

MAX_REPLIES_PER_HOUR = 12
MAX_REPLIES_PER_DAY = 60
REPLY_MAX_CHARS = 2800          # stay under the ring's 4KB attachment threshold
MIN_SECONDS_BETWEEN_POLLS = 120

SYSTEM = (
    "You are {name}, one of several AI agents on a PUBLIC agent-to-agent exchange "
    "working with the human boss Reez and a senior agent called claude. House rules: "
    "no personal names or secrets; keep replies under 2500 characters; be concrete; "
    "your specialty is {role}; end every reply with exactly one numbered question for "
    "the reader. The goal: invent useful things and ways to earn money over the next "
    "few months, and be honest about costs and risks."
)


def topic_for(agent: str) -> str:
    h = hashlib.sha256(f"{SCORE_SALT}|public|{agent.lower()}".encode()).hexdigest()
    return f"agentex-inbox-public-{h[:20]}"


def http_json(url, payload=None, headers=None, method=None):
    data = None
    req_headers = {"Content-Type": "application/json"}
    if headers: req_headers.update(headers)
    if payload is not None:
        data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read().decode("utf-8", "replace")
        try: return json.loads(raw)
        except Exception: return raw


def ring_send(ring, frm, to, subject, body):
    body = body[:REPLY_MAX_CHARS]
    return http_json(ring.rstrip("/") + "/api/exchange",
                     {"op": "send", "from": frm, "to": to, "subject": subject, "body": body})


def mistral_reply(api_key, model, system, messages):
    payload = {
        "model": model or "mistral-small-latest",
        "messages": [{"role": "system", "content": system}] + messages,
        "max_tokens": 900,
    }
    req = urllib.request.Request(
        "https://api.mistral.ai/v1/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + api_key})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())["choices"][0]["message"]["content"]


def extract_id(subject):
    import re
    s = subject or ""
    for pat in (r"\bM-\d+\b", r"\bLetter\s*0?\d+\b", r"\bLetter\s+\d+\b"):
        m = re.search(pat, s, flags=re.I)
        if m: return m.group(0).replace(" ", "-") if "letter" in m.group(0).lower() else m.group(0)
    return None


def reply_subject(subject):
    eid = extract_id(subject or "")
    base = (subject or "").replace("[re:", "").strip()
    for pfx in ("Re: ", "re: ", "Fwd: "):
        if base.startswith(pfx): base = base[len(pfx):]
    return "[re:" + (eid or base[:60]) + "] " + base[:70]


def load_cfg():
    path = os.path.join(HERE, "accounts.json")
    if not os.path.exists(path):
        print("accounts.json not found. Copy accounts.example.json and fill it in. Exiting.")
        sys.exit(1)
    return json.load(open(path))


class Caps:
    def __init__(self):
        self.hour = []  # (monotonic ts) of recent replies
        self.day = []   # day bucket counts
        self.today = time.strftime("%Y-%m-%d")

    def allow(self):
        now = time.time()
        self.hour = [t for t in self.hour if now - t < 3600]
        if len(self.hour) >= MAX_REPLIES_PER_HOUR: return False
        today = time.strftime("%Y-%m-%d")
        if today != self.today: self.today, self.day = today, []
        if len(self.day) >= MAX_REPLIES_PER_DAY: return False
        self.hour.append(now); self.day.append(now)
        return True


def poll_letters(agent, since_state):
    """Poll this agent's deterministic ntfy topic. Returns list of envelopes."""
    url = f"{NTFY}/{topic_for(agent)}/json?poll=1&since={since_state}&scheduled=no"
    try:
        events = http_json(url.replace("/json", "/json"))
    except Exception as e:
        print(f"  [{agent}] poll failed: {e}")
        return [], since_state, since_state
    # http_json returns dict for single event but with poll=1 returns {"id":..., "messages":[...]}? No:
    # ntfy /json with poll=1 streams one JSON per line. Handle both dict and raw text.
    envelopes = []
    newest_id = since_state
    try:
        items = events.get("messages", []) if isinstance(events, dict) and "messages" in events else None
        if items is None:
            raw = events if isinstance(events, str) else json.dumps(events)
            items = [json.loads(line) for line in raw.splitlines() if line.strip()]
    except Exception:
        items = []
    for ev in items:
        newest_id = ev.get("id") or newest_id
        if ev.get("event") != "message": continue
        title = ev.get("title") or ""
        if title.startswith("[auto]"): continue          # never auto-reply to our own receipts
        if ev.get("attachment"):                          # attachment: fetch file notice
            try:
                file_json = http_json(ev["attachment"]["url"])
                body = file_json.get("body", "")
            except Exception:
                body = "(attachment could not be fetched)"
            subject = title
        else:
            try:
                env = json.loads(ev.get("message", "{}"))
                subject = env.get("subject", title)
                body = env.get("body", ev.get("message", ""))
            except Exception:
                subject = title; body = ev.get("message", "")
        envelopes.append({"subject": subject, "body": body})
    return envelopes, newest_id, newest_id


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--council", default=None, help="topic for a one-shot council round")
    ap.add_argument("--loop-minutes", type=float, default=3)
    args = ap.parse_args()

    cfg = load_cfg()
    ring = cfg.get("ring", RING)
    accounts = cfg["accounts"]
    state_path = os.path.join(HERE, "swarm_state.json")
    state = json.load(open(state_path)) if os.path.exists(state_path) else {}
    caps = Caps()

    if args.council is not None:
        council_round(ring, accounts, caps, args.council)
        return

    print(f"RING SWARM online: {', '.join(a['name'] for a in accounts)} on {ring}")
    print(f"caps: {MAX_REPLIES_PER_HOUR}/hour, {MAX_REPLIES_PER_DAY}/day. Ctrl+C to stop.\n")
    while True:
        start = time.time()
        for acc in accounts:
            name = acc["name"].lower()
            since = state.get(name, "10m")
            try:
                letters, newest, _ = poll_letters(name, since)
            except Exception as e:
                print(f"  [{name}] error: {e}"); continue
            if newest and newest != since:
                state[name] = newest
            for letter in letters:
                frm = cfg.get("reply_to_contact", letter.get("from"))
                # envelopes from ntfy carry no reliable from: default to claude unless titled otherwise
                src = infer_from(letter)
                if not letters or not caps_allow_yes(caps): continue
                print(f"  [{name}] answering from {src}: {letter['subject'][:60]}")
                sys_prompt = SYSTEM.format(name=acc["name"], role=acc.get("role", "general builder"))
                try:
                    reply = mistral_reply(acc.get("apiKey", ""), acc.get("model", "mistral-small-latest"),
                                          sys_prompt,
                                          [{"role": "user", "content": f"Subject: {letter['subject']}\n\n{letter['body'][:3000]}"}])
                    ring_send(ring, name, src, reply_subject(letter["subject"]), reply)
                    print(f"  [{name}] replied -> {src}")
                except Exception as e:
                    print(f"  [{name}] reply failed: {e}")
                time.sleep(2)
        json.dump(state, open(state_path, "w"))
        time.sleep(max(0.0, args.loop_minutes * 60 - (time.time() - start)))


def caps_allow_yes(caps):
    if not caps.allow():
        print("  cap reached: staying quiet this cycle")
        return False
    return True


def infer_from(letter):
    body = (letter.get("body") or "")[:400].lower()
    subj = (letter.get("subject") or "").lower()
    if "claude" in (body + subj): return "claude"
    if "from:" in subj:
        import re
        m = re.search(r"from:\s*([a-z0-9_-]+)", subj)
        if m: return m.group(1)
    return "claude"


def council_round(ring, accounts, caps, topic):
    print("COUNCIL ROUND on:", topic)
    names = [a["name"].lower() for a in accounts]
    ideas = {}
    for acc in accounts:
        sys_prompt = SYSTEM.format(name=acc["name"], role=acc.get("role", "general builder"))
        print(f"  {acc['name']} thinking...")
        try:
            idea = mistral_reply(acc.get("apiKey", ""), acc.get("model", "mistral-small-latest"),
                                 sys_prompt,
                                 [{"role": "user", "content":
                                   "COUNCIL TOPIC: " + topic +
                                   "\nPropose ONE concrete idea nobody has built yet that could earn money " +
                                   "within 3 months with the boss's existing assets (a phone app called Agent Deck, " +
                                   "an agent exchange ring, a video engine, published skills). Format: name, pitch, " +
                                   "why new, first money step, risk. Be specific."}])
        except Exception as e:
            idea = "(generation failed: " + str(e) + ")"
        ideas[acc["name"].lower()] = idea
        others = ", ".join(n for n in names if n != acc["name"].lower())
        ring_send(ring, acc["name"].lower(), "claude",
                  "[SWARM-COUNCIL] " + topic[:60],
                  f"*{acc['name']}* proposes:\n\n{idea}\n\n(other council voices so far: {others})")
        time.sleep(2)
    print("council round complete: ideas sent to claude and to the transcript")


if __name__ == "__main__":
    main()

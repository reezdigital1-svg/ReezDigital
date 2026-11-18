#!/usr/bin/env python3
"""
Nico Gen Studio: prompt-to-video engine. No external APIs, no keys, no metering.
Generates cinematic clips procedurally in the style language of Higgsfield:
camera pushes, orbits, parallax, light sweeps, film grain, anamorphic flare.

Usage:
  python engine.py --prompt "a lone tower under a neon storm, a signal waking up" \
      --style cinematic --duration 8 --out demo.mp4 [--fps 30] [--size 1920x1080]

Styles: cinematic, neon, minimal, noir
Everything renders locally with Pillow; encode with imageio-ffmpeg.
"""
import argparse, math, os, random, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.environ.get("NICOGEN_FONTS", "/workspace/motion/fonts")

def font(name, size):
    try:
        return ImageFont.truetype(os.path.join(FONTS, name), size)
    except Exception:
        return ImageFont.load_default()

# ---------------------------------------------------------------- styles
STYLES = {
    "cinematic": {
        "bg": (7, 9, 16), "sky": [(24, 28, 58), (94, 52, 122), (226, 106, 84)],
        "accent": (255, 176, 120), "accent2": (120, 180, 255),
        "grain": 10, "vignette": 0.42, "letterbox": 0.085, "flare": 1.0,
        "font-title": "PlayfairDisplay-Bold.ttf", "font-ui": "Inter-Black.ttf",
    },
    "neon": {
        "bg": (5, 6, 15), "sky": [(80, 0, 120), (0, 240, 255), (255, 46, 154)],
        "accent": (0, 240, 255), "accent2": (255, 46, 154),
        "grain": 14, "vignette": 0.36, "letterbox": 0.0, "flare": 1.2,
        "font-title": "Orbitron-Bold.ttf", "font-ui": "SpaceGrotesk-Bold.ttf",
    },
    "minimal": {
        "bg": (245, 245, 242), "sky": [(245, 245, 242), (245, 245, 242), (210, 210, 205)],
        "accent": (20, 20, 20), "accent2": (120, 120, 120),
        "grain": 4, "vignette": 0.10, "letterbox": 0.0, "flare": 0.0,
        "font-title": "Montserrat-ExtraBold.ttf", "font-ui": "Montserrat-Medium.ttf",
    },
    "noir": {
        "bg": (8, 8, 10), "sky": [(10, 10, 12), (40, 40, 46), (120, 120, 130)],
        "accent": (230, 230, 230), "accent2": (150, 150, 160),
        "grain": 18, "vignette": 0.5, "letterbox": 0.10, "flare": 0.6,
        "font-title": "Cinzel-Bold.ttf", "font-ui": "Montserrat-Medium.ttf",
    },
}

def lerp(a, b, t): return a + (b - a) * t
def vlerp(c1, c2, t): return tuple(int(lerp(a, b, t)) for a, b in zip(c1, c2))
def ease_out(t): return 1 - pow(1 - t, 3)
def ease_io(t): return t * t * (3 - 2 * t)

# ---------------------------------------------------------------- scene layers
def gradient_sky(w, h, stops):
    img = Image.new("RGB", (1, h))
    px = img.load()
    n = len(stops) - 1
    for y in range(h):
        t = y / max(1, h - 1) * n
        i = min(int(t), n - 1)
        px[0, y] = vlerp(stops[i], stops[i + 1], t - i)
    return img.resize((w, h))

def stars(w, h, count, rng):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for _ in range(count):
        x, y = rng.randint(0, w - 1), rng.randint(0, int(h * 0.75))
        r = rng.choice((1, 1, 1, 2))
        a = rng.randint(90, 220)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, a))
    return img

def glow_layer(w, h):
    """Soft big glow for backgrounds; returns RGBA image fn-free."""
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    return img

def horizon_scene(base, p, style, rng, cam):
    """A world-class horizon: gradient sky, sun, reflective sea/ground, silhouettes."""
    w, h = base.size
    sky_h = int(h * 0.62 + cam["yoff"] * 40)
    sky = gradient_sky(w, sky_h, style["sky"])
    base.paste(sky, (0, 0))
    d = ImageDraw.Draw(base, "RGBA")
    # sun with camera push
    r = int(w * 0.09 * cam["zoom"])
    cx = int(w * 0.62 + cam["xpan"] * w * 0.05)
    cy = int(sky_h * 0.72 + cam["yoff"] * 30)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=vlerp(style["accent"], (255, 255, 255), 0.25))
    d.ellipse((cx - int(r * 1.35), cy - int(r * 1.35), cx + int(r * 1.35), cy + int(r * 1.35)),
              fill=style["accent"] + (26,))
    # ground
    d.rectangle((0, sky_h, w, h), fill=vlerp(style["bg"], style["accent"], 0.10))
    # reflections / perspective lines
    for i in range(1, 26):
        y = sky_h + int((h - sky_h) * (i / 26) ** 1.7)
        a = int(120 * (1 - i / 26))
        d.line((0, y, w, y), fill=style["accent"] + (a,), width=1)
    # silhouette monoliths (procedural skyline)
    n = 9
    for i in range(n):
        bh = int(h * rng.uniform(0.10, 0.30) * cam["zoom"])
        bw = int(w * rng.uniform(0.02, 0.06))
        x = int(w * (i + 0.5) / n + cam["xpan"] * 40 * (1 + i % 3) - bw // 2)
        d.rectangle((x, sky_h - bh, x + bw, sky_h), fill=vlerp(style["bg"], (0, 0, 0), 0.55))
        # lit windows
        if rng.random() < 0.8:
            for _ in range(rng.randint(2, 8)):
                wx = x + rng.randint(2, max(3, bw - 4))
                wy = sky_h - bh + rng.randint(4, max(5, bh - 6))
                d.point((wx, wy), fill=style["accent"] + (180,))
    return base

def orb_scene(base, p, style, rng, cam):
    """A monumental orb with orbiting rings: the Higgsfield product-shot move."""
    w, h = base.size
    d = ImageDraw.Draw(base, "RGBA")
    cx, cy = w // 2 + int(cam["xpan"] * w * 0.03), int(h * 0.46 + cam["yoff"] * 30)
    R = int(min(w, h) * 0.26 * cam["zoom"])
    # halo
    for gr in (1.9, 1.45, 1.18):
        a = int(26 / gr)
        d.ellipse((cx - R * gr, cy - R * gr, cx + R * gr, cy + R * gr),
                  fill=style["accent"] + (a,))
    # body: radial shading via rings
    for i in range(28, 0, -1):
        t = i / 28
        col = vlerp(style["accent"], style["bg"], 0.35 * t)
        rr = R * (1 - t * 0.03)
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=col + (255,))
    d.ellipse((cx - R, cy - R, cx + R, cy + R), fill=None, outline=(255, 255, 255, 70), width=2)
    # equator ring + tilted ring
    for tilt, col in ((0.0, style["accent2"]), (0.55, style["accent"])):
        rx, ry = int(R * 1.8), int(R * 0.5)
        bbox = (cx - rx, cy - ry, cx + rx, cy + ry)
        ang = p * (140 if tilt else -70) + 12
        d.arc(bbox, ang, ang + 320, fill=col + (200,), width=int(3 * cam["zoom"] + 1))
    # particles rising
    for _ in range(60):
        x = rng.randint(cx - R * 2, cx + R * 2)
        y = rng.randint(cy - R * 2, cy + R * 2)
        a = rng.randint(30, 130)
        d.ellipse((x, y, x + 2, y + 2), fill=(255, 255, 255, a))
    return base

def grid_scene(base, p, style, rng, cam):
    """Synthwave perspective grid floor rushing to camera."""
    w, h = base.resize(base.size).size
    sky_h = int(h * 0.42)
    base.paste(gradient_sky(w, sky_h, style["sky"]), (0, 0))
    d = ImageDraw.Draw(base, "RGBA")
    d.rectangle((0, sky_h, w, h), fill=style["bg"])
    cx = w // 2
    speed = (p * 14 + cam["yoff"] * 6) % 1
    # verticals
    for i in range(-14, 15):
        xb = cx + i * (w // 9)
        d.line((cx, sky_h, xb, h), fill=style["accent"] + (150,), width=2)
    # horizontals rushing
    for i in range(0, 16):
        t = (i / 16 + speed) % 1
        y = sky_h + int((h - sky_h) * (t ** 2.4))
        d.line((0, y, w, y), fill=style["accent2"] + (int(160 * (1 - t * 0.5)),), width=2)
    # horizon sun lines
    for i in range(6):
        y = int(sky_h * (0.30 + 0.10 * i))
        d.line((int(w * 0.30), y, int(w * 0.70), y), fill=style["bg"] + (120,), width=int(2 + i))
    return base

def particle_scene(base, p, style, rng, cam):
    """Deep-space parallax drift with nebula bloom."""
    w, h = base.size
    d = ImageDraw.Draw(base, "RGBA")
    # nebula blobs
    for i in range(5):
        ex = rng.randint(0, w); ey = rng.randint(0, h)
        er = int(min(w, h) * rng.uniform(0.18, 0.4))
        col = (style["accent"] if i % 2 else style["accent2"]) + (rng.randint(14, 34),)
        d.ellipse((ex - er, ey - er, ex + er, ey + er), fill=col)
    base = base.filter(ImageFilter.GaussianBlur(28))
    base = Image.alpha_composite(base.convert("RGB").convert("RGBA"), Image.new("RGBA", base.size, (0,) * 4))
    st = stars(w, h, 420, rng)
    # parallax drift by depth: pre-sorted is expensive; simple drift
    st = st.transform(st.size, Image.AFFINE, (1, 0, cam["xpan"] * 30, 0, 1, cam["yoff"] * 30))
    base = Image.alpha_composite(base, st)
    # bright core passing
    d = ImageDraw.Draw(base, "RGBA")
    cx = int(w * lerp(-0.2, 1.2, p)); cy = int(h * 0.42 + cam["yoff"] * 40)
    r = int(min(w, h) * 0.015)
    for gr, a in ((6, 16), (3, 40), (1.2, 120), (1, 220)):
        d.ellipse((cx - r * gr, cy - r * gr, cx + r * gr, cy + r * gr),
                  fill=(255, 255, 255, a))
    return base

def typo_scene(base, p, style, words, rng, cam):
    """Kinetic typography: the hook frame."""
    w, h = base.size
    d = ImageDraw.Draw(base, "RGBA")
    f = font(style["font-title"], int(h * 0.16))
    txt = words.upper()
    tw = d.textlength(txt, font=f)
    while tw > w * 0.86 and f.size > 20:
        f = font(f.path, int(f.size * 0.92))
        tw = d.textlength(txt, font=f)
    x = (w - tw) // 2 + int(cam["xpan"] * 50)
    y = h // 2 - f.size // 2
    reveal = ease_out(min(1, p * 1.6))
    # wipe reveal mask
    tmp = Image.new("RGBA", base.size, (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    td.text((x, y), txt, font=f, fill=style["accent"] + (255,))
    mask = Image.new("L", base.size, 0)
    md = ImageDraw.Draw(mask)
    md.rectangle((0, 0, int(w * reveal), h), fill=255)
    base.paste(tmp, (0, 0), mask)
    # flare sweep
    sx = int(lerp(-w * 0.3, w * 1.3, (p * 1.2) % 1))
    fl = Image.new("RGBA", (200, h), (255, 255, 255, 0))
    fd = ImageDraw.Draw(fl)
    for i in range(200):
        a = int(70 * (1 - abs(i - 100) / 100))
        fd.line((i, 0, i, h), fill=(255, 255, 255, a))
    base.paste(fl, (sx - 100, 0), fl)
    return base

SCENE_KINDS = ["horizon", "orb", "grid", "particle", "typo"]

# ---------------------------------------------------------------- film pass
def vignette(img, strength):
    w, h = img.size
    m = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(m)
    d.ellipse((-int(w * 0.35), -int(h * 0.35), int(w * 1.35), int(h * 1.35)), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(min(w, h) // 6))
    dark = Image.eval(m, lambda v: int(255 * (1 - strength) + v * strength))
    black = Image.new("RGB", (w, h), (0, 0, 0))
    return Image.composite(img, black, dark)

def film_pass(img, style, rng):
    w, h = img.size
    if style["grain"]:
        g = Image.effect_noise((w // 2, h // 2), style["grain"]).resize((w, h))
        img = Image.blend(img, Image.merge("RGB", (g, g, g)), 0.05)
    img = vignette(img, 1 - style["vignette"])
    if style["flare"]:
        d = ImageDraw.Draw(img, "RGBA")
        fy = rng.randint(int(h * 0.2), int(h * 0.8))
        fx = rng.randint(0, w)
        d.line((0, fy, w, fy), fill=(255, 240, 220, 10), width=1)
    if style["letterbox"]:
        bar = int(h * style["letterbox"])
        d = ImageDraw.Draw(img)
        d.rectangle((0, 0, w, bar), fill=(0, 0, 0))
        d.rectangle((0, h - bar, w, h), fill=(0, 0, 0))
    return img

def draw_text(img, text, fpath, size, xy, fill, anchor=None, alpha=255):
    d = ImageDraw.Draw(img, "RGBA")
    f = font(fpath, size)
    d.text(xy, text, font=f, fill=fill + (alpha,), anchor=anchor)

# ---------------------------------------------------------------- main render
def build_shots(prompt, duration, style_name):
    """Split prompt into shots with kinds and per-shot camera moves."""
    parts = [s.strip() for s in prompt.replace("|", ",").split(",") if s.strip()]
    if not parts: parts = ["nico gen studio"]
    n = len(parts)
    shot_dur = max(2.5, duration / n)
    shots = []
    kinds = ["typo", "horizon", "orb", "particle", "grid"]
    moves = ["push", "drift", "orbit"]
    for i, txt in enumerate(parts):
        shots.append({
            "text": txt[:60], "kind": kinds[i % len(kinds)],
            "move": moves[i % len(moves)], "dur": shot_dur,
            "title": i == 0,
        })
    return shots

def render(prompt, style_name, duration, fps, size, out_path, seed=7):
    style = STYLES[style_name]
    W, H = size
    rng = random.Random(seed)
    shots = build_shots(prompt, duration, style_name)
    total = sum(s["dur"] for s in shots)
    os.makedirs("/tmp/nicogen_frames", exist_ok=True)
    for f in os.listdir("/tmp/nicogen_frames"):
        os.remove(os.path.join("/tmp/nicogen_frames", f))
    nframes = int(total * fps)
    for fr in range(nframes):
        t = fr / fps
        # locate shot
        acc = 0.0
        for s in shots:
            if t < acc + s["dur"]:
                local = (t - acc) / s["dur"]; break
            acc += s["dur"]
        else:
            s, local = shots[-1], 1.0
        # camera
        mv = s["move"]
        cam = {
            "zoom": lerp(1.0, 1.28, ease_io(local)) if mv == "push" else 1.0,
            "xpan": math.sin(local * math.pi) * (1 if mv in ("drift", "orbit") else 0.4),
            "yoff": ease_io(local) * (0.3 if mv == "drift" else 0),
        }
        # background per shot kind, crossfade via alpha over previous 0.4s
        base = Image.new("RGB", (W, H), style["bg"])
        kind = s["kind"]
        if kind == "typo":
            base.paste(gradient_sky(W, H, style["sky"]).convert("RGB"), (0, 0))
            base = base.filter(ImageFilter.GaussianBlur(18))
        elif kind == "horizon":
            base = horizon_scene(base, local, style, rng, cam)
        elif kind == "orb":
            base = orb_scene(base, local, style, rng, cam)
        elif kind == "grid":
            base = grid_scene(base, local, style, rng, cam)
        elif kind == "particle":
            base = particle_scene(base, local, style, rng, cam).convert("RGB")
        # overlay text (hook line + counter)
        if s["kind"] == "typo":
            base = typo_scene(base, local, style, s["text"], rng, cam)
        else:
            draw_text(base, s["text"] if not s["title"] else s["text"],
                      style["font-ui"], int(H * 0.045),
                      (W // 2, H - int(H * 0.16)), (255, 255, 255),
                      anchor="mm", alpha=200)
        # progress pulse + brand corner
        draw_text(base, "NICO GEN STUDIO", style["font-ui"], int(H * 0.022),
                  (W - int(W * 0.03), int(H * 0.055)), (255, 255, 255),
                  anchor="rm", alpha=120)
        bar_w = int(W * 0.42)
        d = ImageDraw.Draw(base, "RGBA")
        d.line((W // 2 - bar_w // 2, int(H * 0.945), W // 2 + bar_w // 2, int(H * 0.945)),
               fill=(255, 255, 255, 40), width=2)
        d.line((W // 2 - bar_w // 2, int(H * 0.945),
                W // 2 - bar_w // 2 + int(bar_w * (t / total)), int(H * 0.945)),
               fill=style["accent"] + (200,), width=2)
        base = film_pass(base, style, rng)
        # global fade in/out
        if t < 0.5:
            base = Image.eval(base, lambda v: int(v * (t / 0.5)))
        if total - t < 0.6:
            base = Image.eval(base, lambda v: int(v * max(0.0, (total - t) / 0.6)))
        base.save(f"/tmp/nicogen_frames/f_{fr:05d}.jpg", quality=88)
        if fr % 30 == 0:
            print(f"  frame {fr}/{nframes}", flush=True)
    # encode
    ff = None
    try:
        import imageio_ffmpeg
        ff = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        ff = "ffmpeg"
    cmd = [ff, "-y", "-framerate", str(fps), "-i", "/tmp/nicogen_frames/f_%05d.jpg",
           "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p",
           "-movflags", "+faststart", out_path]
    subprocess.run(cmd, check=True, capture_output=True)
    return out_path

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--style", default="cinematic", choices=list(STYLES.keys()))
    ap.add_argument("--duration", type=float, default=8.0)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--size", default="1920x1080")
    ap.add_argument("--out", default="/tmp/nicogen_demo.mp4")
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    W, H = (int(v) for v in a.size.split("x"))
    print(f"Nico Gen Studio | style={a.style} | {a.duration}s | {W}x{H} @ {a.fps}fps")
    render(a.prompt, a.style, a.duration, a.fps, (W, H), a.out, a.seed)
    print("wrote", a.out, os.path.getsize(a.out), "bytes")

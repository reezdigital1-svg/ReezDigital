"""Render a short film with Nicodiff (our own diffusion model, EMA weights).

Act 1  "from noise"      : the x0 prediction at each of 60 DDIM steps, one world
                           emerging from pure noise.
Act 2  "world surgery"   : latent noise-space walk between real seed points,
                           full DDIM per frame, worlds that never existed.
Act 3  "the collection"  : 8 worlds sampled in parallel, hold and drift.

Output: /tmp/nicodiff_video.mp4 (960x960, nearest-upsampled 32x32 worlds,
silent by design: the audio of this piece is the metric report, not music).
"""
import importlib.util, math, os
from PIL import Image as PILImage

import numpy as np
import torch

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("nd", os.path.join(HERE, "nicodiff.py"))
nd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nd)

import torch.nn.functional as F
import imageio.v2 as imageio

OUT = "/tmp/nicodiff_frames"
os.makedirs(OUT, exist_ok=True)
FPS = 24
SIZE = 960          # output square
ACT1_DWELL = 2      # repeat each denoise frame N times
ACT2_HOLD = 0

torch.manual_seed(2026)
ck = torch.load(os.path.join(HERE, "nicodiff_v0.pt"), map_location="cpu")
model = nd.TinyUNet(); model.load_state_dict(ck["ema"]); model.eval()

@torch.no_grad()
def ddim_trace(x_start, steps=60, record="final"):
    """DDIM eta=0. record='x0' yields per-step cleaned predictions; 'final' yields last only."""
    x = x_start.clone()
    ts = torch.linspace(nd.TIMESTEPS - 1, 0, steps).long()
    frames = []
    for i in range(steps):
        t = int(ts[i]); tb = torch.full((x.shape[0],), t, dtype=torch.long)
        eps = model(x, tb)
        ab_t = nd.ALPHAS.float()[t].view(1, 1, 1, 1)
        x0 = ((x - (1.0 - ab_t).sqrt() * eps) / ab_t.sqrt()).clamp(-1.0, 1.0)
        if i < steps - 1:
            ab_n = nd.ALPHAS.float()[int(ts[i + 1])].view(1, 1, 1, 1)
            x = ab_n.sqrt() * x0 + (1.0 - ab_n).sqrt() * eps
        else:
            x = x0
        if record == "x0":
            frames.append(x0[0].clone())
    return frames if record == "x0" else x

def to_img(tile):
    """(3,32,32) float [-1,1] -> (S,S,3) uint8, nearest to SIZE with slight sharpening pass."""
    t = tile.clamp(-1, 1)[None]
    up = F.interpolate(t, size=SIZE, mode="nearest")[0]
    arr = ((up * 0.5 + 0.5).permute(1, 2, 0).numpy() * 255).astype(np.uint8)
    return arr

def save(arr, name):
    imageio.imwrite(os.path.join(OUT, name), arr)

print("ACT 1: x0 predictions over DDIM (one world from noise)", flush=True)
x_start = torch.randn(1, nd.CH, nd.IMG, nd.IMG)
trace = ddim_trace(x_start, steps=60, record="x0")
names = []
idx = 0
for f in trace:
    for _ in range(ACT1_DWELL):
        n = f"act1_{idx:04d}.png"; names.append(n)
        save(to_img(f), n); idx += 1
act1_count = len(names)

print("ACT 2: noise-space walk between worlds", flush=True)
torch.manual_seed(4242)
anchors = [torch.randn(1, nd.CH, nd.IMG, nd.IMG) for _ in range(5)]
seg = 14  # frames between anchors
for a in range(len(anchors) - 1):
    for s in range(seg):
        w = s / seg
        xa = math.cos(w * math.pi / 2) * anchors[a] + math.sin(w * math.pi / 2) * anchors[a + 1]
        img = to_img(ddim_trace(xa, steps=60, record="final")[0])
        n = f"act2_{a:02d}_{s:02d}.png"
        save(img, n); names.append(n)
act2_count = len(names) - act1_count

print("ACT 3: the collection (8 worlds, parallel)", flush=True)
# reuse latest 8 act2 finals sampling style: sample 8 worlds at once
torch.manual_seed(90210)
x8 = torch.randn(8, nd.CH, nd.IMG, nd.IMG)
ts = torch.linspace(nd.TIMESTEPS - 1, 0, 60).long()
with torch.no_grad():
    for i in range(60):
        t = int(ts[i]); tb = torch.full((8,), t, dtype=torch.long)
        eps = model(x8, tb)
        ab_t = nd.ALPHAS.float()[t].view(1, 1, 1, 1)
        x0 = ((x8 - (1 - ab_t).sqrt() * eps) / ab_t.sqrt()).clamp(-1, 1)
        if i < 59:
            ab_n = nd.ALPHAS.float()[int(ts[i + 1])].view(1, 1, 1, 1)
            x8 = ab_n.sqrt() * x0 + (1 - ab_n).sqrt() * eps
        else:
            x8 = x0
worlds = [to_img(x8[k]) for k in range(8)]
# grid of 4 (2x2), cycle order
order = [[0, 1, 2, 3], [4, 5, 6, 7], [1, 5, 0, 4], [3, 7, 2, 6], [6, 2, 7, 3]]
for rep in range(6):
    for g in order:
        frame = np.zeros((SIZE + 8, SIZE + 8, 3), np.uint8)
        frame[:] = 12
        poses = [(0, 0), (SIZE // 2 + 4, 0), (0, SIZE // 2 + 4), (SIZE // 2 + 4, SIZE // 2 + 4)]
        for p, w in zip(poses, [worlds[i] for i in g]):
            quarter = p[1], p[1] + SIZE // 2, p[0], p[0] + SIZE // 2  # y0,y1,x0,x1 -> build below
        # build quarters directly
        half = SIZE // 2
        frame = np.zeros((SIZE, SIZE, 3), np.uint8)
        for pi, gi in enumerate(g):
            yy = (pi // 2) * half; xx = (pi % 2) * half
            q = worlds[gi]
            # downscale world to half for the quarter
            qimg = np.asarray(PILImage.fromarray(q).resize((half, half), 1))
            frame[yy:yy + half, xx:xx + half] = qimg
        n = f"act3_{rep:02d}_{g[0]}.png"
        save(frame, n); names.append(n)
act3_count = len(names) - act1_count - act2_count

total = len(names)
print(f"frames: act1 {act1_count} + act2 {act2_count} + act3 {act3_count} = {total} -> {total/FPS:.1f}s", flush=True)
np.save("/tmp/frame_names.npy", np.array(names))

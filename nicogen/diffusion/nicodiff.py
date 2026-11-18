#!/usr/bin/env python3
"""Nicodiff v0: a small DDPM diffusion model trained from scratch on the
Nico Gen Studio engine's own procedural nebula worlds.

No pretrained weights. No external APIs. Single training and sampling file.

Usage:
  python3 nicodiff.py train --steps 1500 --minutes 11
  python3 nicodiff.py sample --n 8
"""
import argparse
import math
import os
import time

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

IMG = 32
CH = 3
TIMESTEPS = 400
DEV = "cpu"
CKPT = "/workspace/nicogen_v2_test/diffusion/nicodiff_v0.pt"
OUT = "/workspace/nicogen_v2_test/diffusion"


# ---------------------------------------------------------------- engine data
def vnoise_ar(xs, ys, freq, seed):
    """Hash-grid value noise on an [0,1) field, tileable, numpy."""
    rng = np.random.default_rng((seed * 2654435761 + freq * 97) % (2 ** 31))
    g = rng.random((freq, freq)).astype(np.float32)
    x = (xs * freq) % freq
    y = (ys * freq) % freq
    x0 = np.floor(x).astype(np.int64) % freq
    y0 = np.floor(y).astype(np.int64) % freq
    x1 = (x0 + 1) % freq
    y1 = (y0 + 1) % freq
    fx = (x - np.floor(x)).astype(np.float32)
    fy = (y - np.floor(y)).astype(np.float32)
    sx = fx * fx * (3.0 - 2.0 * fx)
    sy = fy * fy * (3.0 - 2.0 * fy)
    a = g[y0, x0]
    b = g[y0, x1]
    c = g[y1, x0]
    d = g[y1, x1]
    return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy


def fbm_ar(xs, ys, octaves, seed):
    out = np.zeros_like(xs)
    amp = 0.5
    freq = 1.0
    for o in range(octaves):
        out += amp * vnoise_ar(xs, ys, max(1, int(freq)), seed + o * 31)
        amp *= 0.5
        freq *= 2.0
    return out


PALETTES = [
    ((0.00, 0.94, 1.00), (0.02, 0.02, 0.06)),   # cyan on void
    ((0.49, 0.23, 0.93), (0.03, 0.02, 0.08)),   # violet
    ((1.00, 0.18, 0.60), (0.02, 0.03, 0.07)),   # magenta
    ((0.00, 0.60, 1.00), (0.05, 0.02, 0.10)),   # deep blue
    ((1.00, 0.62, 0.00), (0.04, 0.02, 0.06)),   # solar
]


def nebula_32(seed):
    """One 3x32x32 world from our own engine's fBm math, float in [-1,1]."""
    n = IMG
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    xs /= n
    ys /= n
    core = fbm_ar(xs, ys, 4, int(seed))
    core = (core - core.min()) / (core.max() - core.min() + 1e-6)
    core = core ** 1.8
    ca, cb = PALETTES[int(seed) % len(PALETTES)]
    img = np.zeros((CH, n, n), np.float32)
    for c in range(CH):
        img[c] = cb[c] * (1.0 - core) + ca[c] * core
    rng = np.random.default_rng(int(seed) * 7919 + 13)
    for _ in range(int(rng.integers(2, 7))):
        px = int(rng.integers(1, n - 2))
        py = int(rng.integers(1, n - 2))
        v = float(rng.uniform(0.75, 1.0))
        img[:, py, px] = v
        img[:, py, px + 1] = v * 0.55
        img[:, py + 1, px] = v * 0.55
    return np.clip(img * 2.0 - 1.0, -1.0, 1.0)


def dataset(n=512, seed=1):
    return np.stack([nebula_32(seed * 10007 + i) for i in range(n)])


# -------------------------------------------------------------------- unet
class Block(nn.Module):
    """Residual conv block with FiLM time conditioning."""

    def __init__(self, cin, cout, temb):
        super().__init__()
        self.c1 = nn.Conv2d(cin, cout, 3, padding=1)
        self.c2 = nn.Conv2d(cout, cout, 3, padding=1)
        self.film = nn.Linear(temb, cout * 2)
        self.skip = nn.Conv2d(cin, cout, 1) if cin != cout else nn.Identity()

    def forward(self, x, t):
        h = F.silu(self.c1(x))
        h = self.c2(h)
        fv = self.film(t)
        h = h * (1.0 + fv[:, : h.shape[1], None, None]) + fv[:, h.shape[1]:, None, None]
        return F.silu(h) + self.skip(x)


class TinyUNet(nn.Module):
    """~1-2M param UNet for 32x32 with sinusoidal time embedding."""

    def __init__(self, base=32, temb=128):
        super().__init__()
        half = temb // 2
        self.register_buffer(
            "freqs", torch.exp(torch.linspace(math.log(1e-3), math.log(1e3), half))
        )
        self.time_mlp = nn.Sequential(
            nn.Linear(temb, base * 4), nn.SiLU(), nn.Linear(base * 4, temb)
        )
        self.b1 = Block(CH, base, temb)          # 32x32
        self.d1 = nn.Conv2d(base, base, 3, stride=2, padding=1)    # -> 16
        self.b2 = Block(base, base * 2, temb)    # 16x16
        self.d2 = nn.Conv2d(base * 2, base * 2, 3, stride=2, padding=1)  # -> 8
        self.mid = Block(base * 2, base * 2, temb)  # 8x8
        self.up1 = lambda x: F.interpolate(x, scale_factor=2.0, mode="nearest")
        self.u2 = Block(base * 4, base, temb)    # concat with b2 skip
        self.u1 = Block(base * 2, base, temb)    # concat with b1 skip
        self.out = nn.Conv2d(base, CH, 3, padding=1)

    def t_embed(self, t):
        ang = t.float()[:, None] * self.freqs[None, :]
        return torch.cat([torch.sin(ang), torch.cos(ang)], dim=1)

    def forward(self, x, t):
        temb = self.time_mlp(self.t_embed(t))
        h0 = self.b1(x, temb)              # base, 32
        h1 = self.b2(self.d1(h0), temb)    # base*2, 16
        m = self.mid(self.d2(h1), temb)    # base*2, 8
        u = self.u2(torch.cat([self.up1(m), h1], dim=1), temb)   # base, 16
        u = self.u1(torch.cat([self.up1(u), h0], dim=1), temb)   # base, 32
        return self.out(u)


# -------------------------------------------------------------------- ddpm
BETAS = torch.linspace(1e-4, 0.02, TIMESTEPS, dtype=torch.float64)
ALPHAS = torch.cumprod(1.0 - BETAS, 0)
AB = ALPHAS.float()[None, :, None, None]


def train(steps=1500, minutes=None, bs=32):
    os.makedirs(OUT, exist_ok=True)
    data = torch.from_numpy(dataset(512))
    print(f"data: {tuple(data.shape)} in [{data.min():.2f},{data.max():.2f}]", flush=True)
    unet = TinyUNet().to(DEV)
    nparams = sum(p.numel() for p in unet.parameters())
    print(f"unet params: {nparams/1e6:.2f}M", flush=True)
    opt = torch.optim.AdamW(unet.parameters(), lr=2e-4)
    t0 = time.time()
    for step in range(1, steps + 1):
        idx = torch.randint(0, data.shape[0], (bs,))
        x0 = data[idx].to(DEV)
        t = torch.randint(0, TIMESTEPS, (bs,), device=DEV)
        eps = torch.randn_like(x0)
        ab = ALPHAS.to(DEV).float()[t][:, None, None, None]
        xt = ab.sqrt() * x0 + (1.0 - ab).sqrt() * eps
        pred = unet(xt, t)
        loss = F.mse_loss(pred, eps)
        opt.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(unet.parameters(), 1.0)
        opt.step()
        if step % 100 == 0:
            print(f"step {step:5d}  loss {loss.item():.4f}  {(time.time()-t0):.0f}s", flush=True)
        if minutes and (time.time() - t0) / 60.0 > minutes:
            print(f"timebox of {minutes} min reached at step {step}", flush=True)
            break
    torch.save(unet.state_dict(), CKPT)
    print(f"saved {CKPT}", flush=True)


@torch.no_grad()
def sample(n=8, ckpt=None, steps=60):
    ckpt = ckpt or CKPT
    unet = TinyUNet().to(DEV)
    unet.load_state_dict(torch.load(ckpt, map_location=DEV))
    unet.eval()
    x = torch.randn(n, CH, IMG, IMG, device=DEV)
    ts = torch.linspace(TIMESTEPS - 1, 0, steps).long()
    for i in range(steps):
        t = int(ts[i])
        tb = torch.full((n,), t, device=DEV, dtype=torch.long)
        eps = unet(x, tb)
        ab_t = ALPHAS.to(DEV).float()[t].view(1, 1, 1, 1)
        x0 = (x - (1.0 - ab_t).sqrt() * eps) / ab_t.sqrt()
        x0 = x0.clamp(-1.6, 1.6)
        if i < steps - 1:
            ab_n = ALPHAS.to(DEV).float()[int(ts[i + 1])].view(1, 1, 1, 1)
            x = ab_n.sqrt() * x0 + (1.0 - ab_n).sqrt() * eps
        else:
            x = x0
    x = x.clamp(-1.0, 1.0)
    from PIL import Image

    tiles = ((x * 0.5 + 0.5) * 255).byte()
    up = F.interpolate(tiles.float(), size=192, mode="nearest").byte()
    cols, rows = 4, int(math.ceil(n / 4))
    sheet = Image.new("RGB", (cols * 192, rows * 192), (10, 10, 16))
    for i in range(n):
        im = Image.fromarray(up[i].permute(1, 2, 0).numpy())
        sheet.paste(im, ((i % cols) * 192, (i // cols) * 192))
    path = os.path.join(OUT, "sample_sheet.png")
    sheet.save(path)
    print(f"saved {path}", flush=True)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["train", "sample"])
    ap.add_argument("--steps", type=int, default=1500)
    ap.add_argument("--minutes", type=float, default=None)
    ap.add_argument("--bs", type=int, default=32)
    ap.add_argument("--n", type=int, default=8)
    ap.add_argument("--ckpt", type=str, default=None)
    a = ap.parse_args()
    if a.mode == "train":
        train(steps=a.steps, minutes=a.minutes, bs=a.bs)
    else:
        sample(n=a.n, ckpt=a.ckpt)

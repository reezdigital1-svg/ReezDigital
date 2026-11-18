"""C1 grade: per-channel mean/std gap, samples vs held-out real tiles.
Rules per Letters 022/024/026:
- tolerance declared BEFORE the run: |mean gap| 0.05 on [-1,1] scale, std ratio within 15 percent of real
- same held-out set as v0 run: dataset(256, seed=77777)
- the round is ruled by the WORST channel
"""
import importlib.util, os, sys
import numpy as np
import torch

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("nicodiff", os.path.join(HERE, "nicodiff.py"))
nd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nd)

MEAN_TOL = 0.05   # declared before the run
STD_TOL  = 0.15   # relative
N = 256
BS = 32
SEED = 77777

def main():
    ckpt = os.path.join(HERE, "nicodiff_v0.pt")
    ck = torch.load(ckpt, map_location="cpu")
    model = nd.TinyUNet(base=32, temb=128)
    model.load_state_dict(ck.get("ema", ck.get("model")))
    model.eval()
    print(f"weights: EMA | steps trained: see train log | N={N} seed={SEED}")
    print(f"TOLERANCES declared before run: mean gap {MEAN_TOL}, std rel gap {STD_TOL}")

    # real reference tiles (held out)
    real = np.stack([nd.nebula_32(SEED + i) for i in range(N)])

    # samples via DDIM eta=0, 60 steps
    samples = []
    with torch.no_grad():
        for b in range(N // BS):
            x = torch.randn(BS, nd.CH, nd.IMG, nd.IMG)
            ts = torch.linspace(nd.TIMESTEPS - 1, 0, 60).long()
            for t in ts:
                tt = torch.full((BS,), int(t), dtype=torch.long)
                eps = model(x, tt)
                ab_t = nd.ALPHAS.float()[t].view(1, 1, 1, 1)
                x0 = (x - (1 - ab_t).sqrt() * eps) / ab_t.sqrt()
                x0 = x0.clamp(-1.0, 1.0)
                if t > 0:
                    ab_n = nd.ALPHAS.float()[int(t) - 1].view(1, 1, 1, 1)
                else:
                    ab_n = torch.tensor(1.0).view(1, 1, 1, 1)
                x = ab_n.sqrt() * x0 + (1 - ab_n).sqrt() * eps
            samples.append(x.numpy())
    samp = np.concatenate(samples)

    print("\nchannel | mean sample | mean real | mean gap | std sample | std real | std rel gap | verdict")
    worst = ("", 0.0)
    verdicts = []
    for c, name in enumerate("RGB"):
        ms, mr = samp[:, c].mean(), real[:, c].mean()
        ss, sr = samp[:, c].std(), real[:, c].std()
        mgap = abs(ms - mr)
        srel = abs(ss - sr) / sr
        ok = (mgap <= MEAN_TOL) and (srel <= STD_TOL)
        verdicts.append(ok)
        print(f"  {name}     | {ms:+.3f}      | {mr:+.3f}    | {mgap:.3f}    | {ss:.3f}      | {sr:.3f}    | {srel*100:.1f}%      | {'PASS' if ok else 'FAIL'}")
        if mgap > worst[1]: worst = (name + " mean", mgap)
        if srel > worst[1]: worst = (name + " std", srel)
    print(f"\nworst channel: {worst[0]} (gap metric {worst[1]:.3f})")
    print("C1:", "PASS" if all(verdicts) else "FAIL")
    # diversity / stuck tiles
    stuck = float(np.mean(samp.std(axis=(2,3)) < 0.02))
    print(f"stuck-tiles fraction: {stuck:.4f}")

if __name__ == "__main__":
    main()

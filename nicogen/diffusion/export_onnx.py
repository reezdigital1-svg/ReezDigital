"""Export Nicodiff's TinyUNet to ONNX for browser inference.

Why: the browser question. A 32x32, 0.36M-param UNet is small enough to run
in the browser via ONNX Runtime Web (WebGPU execution provider, WASM CPU
fallback). This script proves the export step on this exact architecture.

Usage:
    python3 export_onnx.py            # random init (parity test only)
    python3 export_onnx.py --ckpt X   # export real trained weights

Outputs nicodiff_unet.onnx next to this file.
"""
import argparse
import importlib.util
import os
import sys
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location(
    "nicodiff", os.path.join(HERE, "nicodiff.py"))
nd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nd)

import torch  # noqa: E402
import onnx  # noqa: E402
import onnxruntime as ort  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ckpt", default=None,
                    help="path to a nicodiff checkpoint (uses EMA weights)")
    ap.add_argument("--opset", type=int, default=17)
    args = ap.parse_args()

    model = nd.TinyUNet(base=32, temb=128)
    n_params = sum(p.numel() for p in model.parameters())
    wsrc = "random init (parity test only; not trained weights)"

    if args.ckpt:
        ck = torch.load(args.ckpt, map_location="cpu")
        state = ck.get("ema", ck.get("model"))
        model.load_state_dict(state)
        wsrc = f"EMA weights from {os.path.basename(args.ckpt)}"
    model.eval()

    x = torch.randn(1, nd.CH, nd.IMG, nd.IMG)
    t = torch.tensor([123], dtype=torch.long)

    onnx_path = os.path.join(HERE, "nicodiff_unet.onnx")
    t0 = time.time()
    torch.onnx.export(
        model, (x, t), onnx_path,
        input_names=["x", "t"],
        output_names=["eps"],
        dynamic_axes={"x": {0: "batch"}, "t": {0: "batch"}, "eps": {0: "batch"}},
        opset_version=args.opset,
        do_constant_folding=True,
    )
    export_s = time.time() - t0

    # Inline external weight data so the browser needs exactly one file.
    m = onnx.load(onnx_path, load_external_data=True)
    onnx.save(m, onnx_path, save_as_external_data=False)
    for ext in (onnx_path + ".data",):
        if os.path.exists(ext):
            os.remove(ext)

    size_b = os.path.getsize(onnx_path)
    onnx.checker.check_model(onnx.load(onnx_path))

    # Parity: torch vs onnxruntime on a fresh input
    x2 = torch.randn(4, nd.CH, nd.IMG, nd.IMG)
    t2 = torch.tensor([0, 111, 275, 399], dtype=torch.long)
    with torch.no_grad():
        ref = model(x2, t2).numpy()
    sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    out = sess.run(["eps"], {"x": x2.numpy(), "t": t2.numpy()})[0]
    max_diff = float(np.abs(ref - out).max())

    print(f"weights      : {wsrc}")
    print(f"params       : {n_params:,}")
    print(f"opset        : {args.opset}")
    print(f"export time  : {export_s:.2f}s")
    print(f"file size    : {size_b:,} bytes ({size_b/1e6:.2f} MB)")
    print(f"parity check : batch of 4, max |torch - ort| = {max_diff:.2e}")
    print("RESULT       :", "PASS" if max_diff < 1e-4 else "FAIL")


if __name__ == "__main__":
    main()

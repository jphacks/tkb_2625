from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

import numpy as np

from .data import (
    fetch_category_samples,
    fetch_samples,
    group_images,
    load_images,
    make_grouped_pairs,
    synth_scenes,
)
from .embed import get_embedder
from .features import FEATURE_NAMES, feature_vector
from .fusion import Fusion
from .judge import DEFAULT_MODEL_DIR, Judgman
from .snn import SNN

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "samples"

def _ensure_images(data_dir: Path, min_count: int = 12) -> list[Path]:
    images = load_images(data_dir)
    if len([p for p in images if p.stem.startswith("cat")]) < 24:
        print(f"fetching same-subject category samples from Wikimedia Commons -> {data_dir}")
        fetch_category_samples(data_dir)
        images = load_images(data_dir)
    if len(images) < min_count:
        print(f"fetching samples from Wikimedia Commons -> {data_dir}")
        fetch_samples(data_dir)
        images = load_images(data_dir)
    if len(images) < min_count:
        print("web fetch insufficient, generating synthetic scenes")
        synth_scenes(data_dir, n=min_count - len(images) + 8)
        images = load_images(data_dir)
    return images

def _feature_matrix(pairs, embedder) -> tuple[np.ndarray, np.ndarray]:
    X = np.zeros((len(pairs), len(FEATURE_NAMES)))
    y = np.zeros(len(pairs))
    for i, (a, b, lab) in enumerate(pairs):
        X[i] = feature_vector(a, b, embedder)
        y[i] = lab
        if (i + 1) % 25 == 0:
            print(f"  features {i + 1}/{len(pairs)}", flush=True)
    return X, y

def _best_threshold(y: np.ndarray, p: np.ndarray) -> tuple[float, float, float]:
    cands = np.unique(np.concatenate([np.linspace(0.02, 0.98, 97), (p[1:] + p[:-1]) / 2]))
    f1s, margins = [], []
    for t in cands:
        pred = p >= t
        tp = float((pred & (y == 1)).sum())
        fp = float((pred & (y == 0)).sum())
        fn = float((~pred & (y == 1)).sum())
        f1 = 2 * tp / (2 * tp + fp + fn) if tp > 0 else 0.0
        wrong = pred != (y == 1)
        margin = -1.0 if wrong.any() else float(np.abs(p - t).min())
        f1s.append(f1)
        margins.append(margin)
    f1s = np.array(f1s)
    margins = np.array(margins)
    best_f1 = float(f1s.max())
    band = np.where(f1s >= best_f1 - 0.02)[0]
    best_i = int(band[np.argmax(margins[band])]) if (margins[band] > 0).any() else int(np.median(band))
    return float(cands[best_i]), best_f1, float(margins[best_i])

def cmd_calibrate(args: argparse.Namespace) -> None:
    data_dir = Path(args.data_dir)
    model_dir = Path(args.model_dir)
    model_dir.mkdir(parents=True, exist_ok=True)
    images = _ensure_images(data_dir)
    print(f"{len(images)} images")
    rng = np.random.default_rng(args.seed)
    groups = group_images(images)
    perm = rng.permutation(len(groups))
    n_train_g = max(4, int(0.7 * len(groups)))
    train_groups = [groups[i] for i in perm[:n_train_g]]
    val_groups = [groups[i] for i in perm[n_train_g:]] or train_groups
    n_tr = sum(len(g) for g in train_groups)
    n_va = sum(len(g) for g in val_groups)
    embedder = get_embedder()
    cache = model_dir / "features.npz"
    if args.use_cache and cache.exists():
        d = np.load(cache)
        if int(d["n_img"]) == len(images):
            Xtr, ytr, Xva, yva = d["Xtr"], d["ytr"], d["Xva"], d["yva"]
            print(f"using cached features ({len(Xtr)} train, {len(Xva)} val)")
        else:
            d = None
    else:
        d = None
    if d is None:
        print("computing train features...")
        Xtr, ytr = _feature_matrix(make_grouped_pairs(train_groups, 2 * n_tr, n_tr, 3 * n_tr, seed=1), embedder)
        print("computing val features...")
        Xva, yva = _feature_matrix(make_grouped_pairs(val_groups, 2 * n_va, n_va, 3 * n_va, seed=2), embedder)
        np.savez(cache, Xtr=Xtr, ytr=ytr, Xva=Xva, yva=yva, n_img=len(images))

    fusion = Fusion()
    fusion.fit(Xtr, ytr)
    snn = SNN(fin=Xtr.shape[1])
    loss = snn.fit(Xtr, ytr, epochs=args.snn_epochs)
    print(f"SNN final loss: {loss:.4f}")

    p_f = fusion.predict_proba(Xva)
    p_s = snn.predict_proba(Xva)
    best = {"blend": 0.5, "threshold": 0.5, "f1": -1.0, "margin": -1.0}
    for blend in [0.5, 0.75, 0.25, 1.0, 0.0]:
        p = blend * p_f + (1 - blend) * p_s
        t, f1, margin = _best_threshold(yva, p)
        if (f1, margin) > (best["f1"], best["margin"]):
            best = {"blend": blend, "threshold": t, "f1": f1, "margin": margin}
    p = best["blend"] * p_f + (1 - best["blend"]) * p_s
    acc = float(((p >= best["threshold"]) == (yva == 1)).mean())
    print(f"val F1={best['f1']:.3f} acc={acc:.3f} blend={best['blend']} threshold={best['threshold']:.2f}")

    from PIL import Image

    def proba(a_img, b_img):
        x = feature_vector(a_img, b_img, embedder)
        return best["blend"] * float(fusion.predict_proba(x)[0]) + (1 - best["blend"]) * float(snn.predict_proba(x)[0])

    multi = [g for g in val_groups if len(g) >= 4] or [g for g in train_groups if len(g) >= 4]
    rngm = np.random.default_rng(5)
    pm, nm = [], []
    for g in multi:
        for q in g[3:]:
            ps = [proba(Image.open(r), Image.open(q)) for r in g[:3]]
            pm.append(max(ps))
    for _ in range(2 * len(multi)):
        gi, gj = rngm.choice(len(multi), size=2, replace=False)
        refs = multi[int(gi)][:3]
        q = multi[int(gj)][int(rngm.integers(len(multi[int(gj)])))]
        nm.append(max(proba(Image.open(r), Image.open(q)) for r in refs))
    t_multi, f1_multi, _ = _best_threshold(np.array([1] * len(pm) + [0] * len(nm)), np.array(pm + nm))
    print(f"multi-ref: n={len(pm)}/{len(nm)} F0.5={f1_multi:.3f} threshold_multi={t_multi:.2f}")

    fusion.save(model_dir / "fusion.json")
    snn.save(model_dir / "snn.pt")
    (model_dir / "params.json").write_text(
        json.dumps(
            {
                "threshold": best["threshold"],
                "threshold_multi": t_multi,
                "blend": best["blend"],
                "fusion": True,
                "feature_names": FEATURE_NAMES,
                "val_f1": best["f1"],
                "val_acc": acc,
                "n_train": int(len(Xtr)),
                "n_val": int(len(Xva)),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"model saved -> {model_dir}")

def cmd_judge(args: argparse.Namespace) -> None:
    j = Judgman(args.model_dir)
    result = j.score(args.ref, args.query)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if result["verdict"] == "ARRIVED" else 1)

def cmd_batch(args: argparse.Namespace) -> None:
    j = Judgman(args.model_dir)
    refs = sorted(Path(args.refs).iterdir())
    queries = sorted(Path(args.queries).iterdir())
    out = Path(args.out) if args.out else None
    rows = []
    for r in refs:
        for q in queries:
            s = j.score(r, q)
            rows.append({"ref": r.name, "query": q.name, **{k: s[k] for k in ("score", "p_fusion", "p_snn", "verdict")}})
            print(f"{r.name} vs {q.name}: {s['score']:.3f} {s['verdict']}")
    if out:
        with out.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)
        print(f"csv -> {out}")

def cmd_demo(args: argparse.Namespace) -> None:
    images = _ensure_images(DATA_DIR)
    model_dir = Path(args.model_dir)
    if not (model_dir / "params.json").exists():
        cal_args = argparse.Namespace(data_dir=DATA_DIR, model_dir=model_dir, seed=7, snn_epochs=150)
        cmd_calibrate(cal_args)
    j = Judgman(model_dir)
    rng = np.random.default_rng(99)
    groups = [g for g in group_images(images) if len(g) >= 4]
    print("\n=== demo: control with 3 reference photos, query = new photo of SAME vs DIFFERENT spot ===")
    ok = 0
    total = 0
    for k in range(args.n):
        g = groups[int(rng.integers(0, len(groups)))]
        refs = [str(p) for p in g[:3]]
        g2 = g
        while g2 is g:
            g2 = groups[int(rng.integers(0, len(groups)))]
        same = str(g[3 + int(rng.integers(len(g) - 3))])
        diff = str(g2[int(rng.integers(len(g2)))])
        for label, q in (("SAME", same), ("DIFF", diff)):
            r = j.score_control(refs, q)
            expect = "ARRIVED" if label == "SAME" else "NOT_ARRIVED"
            mark = "OK " if r["verdict"] == expect else "MISS"
            ok += r["verdict"] == expect
            total += 1
            print(f"[{mark}] {label:4s} {Path(refs[0]).stem[:5]} refs vs {Path(q).name}: score={r['score']:.3f} ({r['verdict']})")
    print(f"\naccuracy: {ok}/{total} = {ok / total:.1%}")

def cmd_control(args: argparse.Namespace) -> None:
    j = Judgman(args.model_dir)
    result = j.score_control(args.refs, args.query)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if result["verdict"] == "ARRIVED" else 1)

def cmd_identify(args: argparse.Namespace) -> None:
    j = Judgman(args.model_dir)
    root = Path(args.controls)
    controls = {}
    for d in sorted(root.iterdir()):
        if d.is_dir():
            refs = load_images(d)
            if refs:
                controls[d.name] = [str(p) for p in refs]
    if not controls:
        sys.exit(f"no control subdirectories in {root}")
    ranked = []
    for name, refs in controls.items():
        r = j.score_control(refs, args.query)
        ranked.append((r["score"], name, r["best_ref"], r["verdict"]))
    ranked.sort(reverse=True)
    print(f"query: {args.query}")
    for s, name, best, verdict in ranked:
        print(f"  {name:24s} score={s:.3f} {verdict:12s} best_ref={Path(best).name}")
    top = ranked[0]
    print(f"-> {top[1]} ({top[0]:.3f}) {top[3]}")
    sys.exit(0 if top[3] == "ARRIVED" else 1)

def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(prog="judgman", description="rogaining arrival judge via image similarity")
    sub = ap.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("calibrate", help="train fusion + SNN and calibrate threshold")
    c.add_argument("--data-dir", default=str(DATA_DIR))
    c.add_argument("--model-dir", default=str(DEFAULT_MODEL_DIR))
    c.add_argument("--seed", type=int, default=7)
    c.add_argument("--snn-epochs", type=int, default=600)
    c.add_argument("--no-cache", dest="use_cache", action="store_false", help="recompute features")
    c.set_defaults(func=cmd_calibrate)

    j = sub.add_parser("judge", help="judge one ref/query pair (exit 0 = ARRIVED)")
    j.add_argument("ref")
    j.add_argument("query")
    j.add_argument("--model-dir", default=str(DEFAULT_MODEL_DIR))
    j.set_defaults(func=cmd_judge)

    c2 = sub.add_parser("control", help="judge query against multiple reference photos of one control")
    c2.add_argument("--refs", nargs="+", required=True)
    c2.add_argument("--query", required=True)
    c2.add_argument("--model-dir", default=str(DEFAULT_MODEL_DIR))
    c2.set_defaults(func=cmd_control)

    i2 = sub.add_parser("identify", help="rank controls (dir of subdirs, each = one control's refs)")
    i2.add_argument("controls")
    i2.add_argument("--query", required=True)
    i2.add_argument("--model-dir", default=str(DEFAULT_MODEL_DIR))
    i2.set_defaults(func=cmd_identify)

    b = sub.add_parser("batch", help="judge all refs x queries")
    b.add_argument("refs")
    b.add_argument("queries")
    b.add_argument("--model-dir", default=str(DEFAULT_MODEL_DIR))
    b.add_argument("--out", default=None)
    b.set_defaults(func=cmd_batch)

    d = sub.add_parser("demo", help="fetch samples, calibrate if needed, run demo")
    d.add_argument("--model-dir", default=str(DEFAULT_MODEL_DIR))
    d.add_argument("--n", type=int, default=8)
    d.set_defaults(func=cmd_demo)

    f = sub.add_parser("fetch", help="download sample images from Wikimedia Commons")
    f.add_argument("--data-dir", default=str(DATA_DIR))
    f.add_argument("--cats", action="store_true", help="fetch same-subject category samples")
    f.set_defaults(
        func=lambda a: print(
            f"downloaded {fetch_category_samples(Path(a.data_dir)) if a.cats else fetch_samples(Path(a.data_dir))} images"
        )
    )

    args = ap.parse_args(argv)
    args.func(args)

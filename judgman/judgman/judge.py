from __future__ import annotations

import json
from pathlib import Path
import sys
import os
from io import BytesIO
import numpy as np

from PIL import Image

from .embed import get_embedder
from .features import FEATURE_NAMES, feature_vector
from .fusion import Fusion
from .snn import SNN
from .sources import load_image


def _as_image(value) -> Image.Image:
    if isinstance(value, Image.Image):
        return value
    if isinstance(value, (bytes, bytearray)):
        img = Image.open(BytesIO(bytes(value)))
        img.load()
        return img
    if isinstance(value, (str, Path)):
        return load_image(str(value))
    if hasattr(value, "read"):
        img = Image.open(value)
        img.load()
        return img
    raise TypeError(f"unsupported image input: {type(value)!r}")

DEFAULT_MODEL_DIR = Path(__file__).resolve().parent.parent / "model"

class Judgman:
    def __init__(self, model_dir: Path | str = DEFAULT_MODEL_DIR) -> None:
        self.model_dir = Path(model_dir)
        self.fusion = Fusion()
        self.snn: SNN | None = None
        self.threshold = 0.5
        self.threshold_multi = 0.5
        self.blend = 0.5
        self.trained = False
        params = self.model_dir / "params.json"
        snn_path = self.model_dir / "snn.pt"
        if params.exists():
            data = json.loads(params.read_text(encoding="utf-8"))
            self.threshold = float(data.get("threshold", 0.5))
            self.threshold_multi = float(data.get("threshold_multi", self.threshold))
            self.blend = float(data.get("blend", 0.5))
            if data.get("fusion"):
                self.fusion.load(self.model_dir / "fusion.json")
            if snn_path.exists():
                self.snn = SNN()
                self.snn.load(snn_path)
            self.trained = True

    def features(self, ref, query) -> np.ndarray:
        return feature_vector(_as_image(ref), _as_image(query), get_embedder())

    def score(self, ref, query) -> dict:
        ref_img = _as_image(ref)
        query_img = _as_image(query)
        x = feature_vector(ref_img, query_img, get_embedder())
        p_f = float(self.fusion.predict_proba(x)[0])
        p_s = float(self.snn.predict_proba(x)[0]) if self.snn is not None else p_f
        final = self.blend * p_f + (1.0 - self.blend) * p_s
        def _label(v):
            if isinstance(v, (str, Path)):
                return str(v)
            if isinstance(v, (bytes, bytearray)):
                return None
            return str(v)

        return {
            "ref": _label(ref),
            "query": _label(query),
            "p_fusion": round(p_f, 4),
            "p_snn": round(p_s, 4),
            "score": round(final, 4),
            "threshold": self.threshold,
            "verdict": "ARRIVED" if final >= self.threshold else "NOT_ARRIVED",
        }

    def score_control(self, ref, query) -> dict:
        ref_list = list(ref) if not isinstance(ref, (str, bytes, bytearray, Path)) else [ref]
        # normalize: if a single path-like/bytes given, wrap already handled; if list of paths okay
        per = [self.score(r, query) for r in ref_list]
        ps = [p["score"] for p in per]
        if ps:
            best_idx = int(np.argmax(ps))
            final = ps[best_idx]
            best_ref = ref_list[best_idx]
        else:
            best_idx = None
            final = 0.0
            best_ref = None
        thr = self.threshold if len(per) <= 1 else self.threshold_multi
        def _label(v):
            if isinstance(v, (str, Path)):
                return str(v)
            if isinstance(v, (bytes, bytearray)):
                return None
            return str(v)

        return {
            "query": _label(query),
            "n_refs": len(per),
            "per_ref": [{"ref": p["ref"], "score": p["score"], "verdict": p["verdict"]} for p in per],
            "best_ref": _label(best_ref),
            "best_score": round(final, 4),
            "score": round(final, 4),
            "threshold": thr,
            "verdict": "ARRIVED" if final >= thr else "NOT_ARRIVED",
        }

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    def main(argv: list[str]) -> int:
        if len(argv) < 3:
            print("usage: judge_cli.py <query image> <ref image> [ref image ...]", file=sys.stderr)
            return 2
        query_path, ref_path = argv[1], argv[2:]
        refs = load_image(str(ref_path))
        query = load_image(str(query_path))
        j = Judgman()
        result = j.score_control(refs, query)
        print(json.dumps(result, ensure_ascii=False))
        return 0 if result["verdict"] == "ARRIVED" else 1
    
    sys.exit(main(sys.argv))
from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from .embed import get_embedder
from .features import FEATURE_NAMES, feature_vector
from .fusion import Fusion
from .snn import SNN
from .sources import load_image

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

    def features(self, ref: Image.Image, query: Image.Image) -> np.ndarray:
        return feature_vector(ref, query, get_embedder())

    def score(self, ref_path: str | Path, query_path: str | Path) -> dict:
        ref = load_image(str(ref_path))
        query = load_image(str(query_path))
        x = self.features(ref, query)
        p_f = float(self.fusion.predict_proba(x)[0])
        p_s = float(self.snn.predict_proba(x)[0]) if self.snn is not None else p_f
        final = self.blend * p_f + (1.0 - self.blend) * p_s
        return {
            "ref": str(ref_path),
            "query": str(query_path),
            "features": {n: round(float(v), 4) for n, v in zip(FEATURE_NAMES, x)},
            "p_fusion": round(p_f, 4),
            "p_snn": round(p_s, 4),
            "score": round(final, 4),
            "threshold": self.threshold,
            "verdict": "ARRIVED" if final >= self.threshold else "NOT_ARRIVED",
        }

    def score_control(self, ref_paths: list[str | Path], query_path: str | Path) -> dict:
        per = [self.score(r, query_path) for r in ref_paths]
        ps = [p["score"] for p in per]
        final = max(ps) if ps else 0.0
        best = per[int(np.argmax(ps))] if ps else None
        thr = self.threshold if len(per) <= 1 else self.threshold_multi
        return {
            "query": str(query_path),
            "n_refs": len(per),
            "per_ref": [
                {"ref": p["ref"], "score": p["score"], "verdict": p["verdict"]} for p in per
            ],
            "best_ref": best["ref"] if best else None,
            "best_score": final,
            "score": round(final, 4),
            "threshold": thr,
            "verdict": "ARRIVED" if final >= thr else "NOT_ARRIVED",
        }

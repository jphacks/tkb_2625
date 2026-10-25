from __future__ import annotations

import json
from pathlib import Path
import sys
import os
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

    def score(self, ref:bytes ,query: bytes) -> dict:
        x = self.features(ref, query)
        p_f = float(self.fusion.predict_proba(x)[0])
        p_s = float(self.snn.predict_proba(x)[0]) if self.snn is not None else p_f
        final = self.blend * p_f + (1.0 - self.blend) * p_s
        return {
            "score": round(final, 4),
            "verdict": "ARRIVED" if final >= self.threshold else "NOT_ARRIVED",
        }

    def score_control(self, ref: list[bytes], query: bytes) -> dict:
        per = [self.score(r, query) for r in ref]
        ps = [p["score"] for p in per]
        final = max(ps) if ps else 0.0
        best = per[int(np.argmax(ps))] if ps else None
        thr = self.threshold if len(per) <= 1 else self.threshold_multi
        return {
            "score": round(final, 4),
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
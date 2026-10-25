from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression

DEFAULT_WEIGHTS = np.array(
    [0.22, 0.03, 0.03, 0.03, 0.03, 0.04, 0.04, 0.04, 0.04, 0.04, 0.10, 0.08, 0.09, 0.05, 0.05, 0.09]
)

class Fusion:
    def __init__(self) -> None:
        self.lr: LogisticRegression | None = None

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        self.lr = LogisticRegression(max_iter=3000, C=1.0)
        self.lr.fit(X, y)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        X = np.atleast_2d(X)
        if self.lr is None:
            return 1.0 / (1.0 + np.exp(-(X @ DEFAULT_WEIGHTS - 0.55)))
        return self.lr.predict_proba(X)[:, 1]

    def save(self, path: Path) -> None:
        if self.lr is None:
            return
        data = {
            "coef": self.lr.coef_[0].tolist(),
            "intercept": float(self.lr.intercept_[0]),
        }
        Path(path).write_text(json.dumps(data), encoding="utf-8")

    def load(self, path: Path) -> None:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        lr = LogisticRegression()
        lr.classes_ = np.array([0, 1])
        lr.coef_ = np.array([data["coef"]])
        lr.intercept_ = np.array([data["intercept"]])
        self.lr = lr

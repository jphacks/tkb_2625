from __future__ import annotations

import functools
from typing import Hashable

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

from .features import _coverage, _overlap

class DinoMatcher:
    def __init__(self, size: int = 518, thresh: float = 0.7) -> None:
        self.model = torch.hub.load("facebookresearch/dinov2", "dinov2_vits14").eval()
        self.size = size
        self.thresh = thresh
        self._cache: dict[Hashable, tuple[np.ndarray, np.ndarray]] = {}
        self._mean = np.array([0.485, 0.456, 0.406], np.float32)
        self._std = np.array([0.229, 0.224, 0.225], np.float32)

    def tokens(self, img: Image.Image, tag: Hashable | None = None):
        key = tag if tag is not None else getattr(img, "filename", None)
        if key is not None and key in self._cache:
            return self._cache[key]
        s = self.size
        a = np.asarray(img.convert("RGB").resize((s, s), Image.BILINEAR), np.float32) / 255.0
        a = (a - self._mean) / self._std
        x = torch.from_numpy(a).permute(2, 0, 1).unsqueeze(0)
        with torch.inference_mode():
            out = self.model.forward_features(x)
        f = F.normalize(out["x_norm_patchtokens"][0], dim=1).numpy().astype(np.float32)
        cls = F.normalize(out["x_norm_clstoken"], dim=-1)[0].numpy().astype(np.float32)
        g = s // 14
        gy, gx = np.meshgrid(np.arange(g), np.arange(g), indexing="ij")
        centers = np.stack([gx.ravel(), gy.ravel()], 1).astype(np.float32)
        if key is not None:
            self._cache[key] = (f, centers, cls)
        return f, centers, cls

    def cls_cos(self, a: Image.Image, b: Image.Image) -> float:
        _, _, ca = self.tokens(a)
        _, _, cb = self.tokens(b)
        return float(ca @ cb)

    def match(self, a: Image.Image, b: Image.Image) -> tuple[float, float, float, float, float]:
        fa, ca, _ = self.tokens(a)
        fb, cb, _ = self.tokens(b)
        s = self.size
        wa, ha = a.size
        wb, hb = b.size
        S = fa @ fb.T
        ia = S.argmax(1)
        ib = S.argmax(0)
        idx_a = [i for i in range(len(ia)) if ib[ia[i]] == i and S[i, ia[i]] > self.thresh]
        if len(idx_a) < 4:
            return min(1.0, len(idx_a) / 48), 0.0, 0.0, 0.0, 0.0
        idx_b = [ia[i] for i in idx_a]
        pA = ca[idx_a] / s * np.array([wa, ha], np.float32)
        pB = cb[idx_b] / s * np.array([wb, hb], np.float32)
        H, mask = cv2_find_homography(pA, pB)
        inl = int(mask.sum()) if mask is not None else 0
        inl_pts = pB[mask.ravel().astype(bool)] if mask is not None else np.empty((0, 2))
        cov = _coverage(inl_pts, wb, hb)
        ovl = _overlap(H, wa, ha, wb, hb) if inl >= 4 else 0.0
        return min(1.0, len(idx_a) / 48), inl / len(idx_a), min(1.0, inl / 24), cov, ovl

def cv2_find_homography(pA: np.ndarray, pB: np.ndarray):
    import cv2

    if len(pA) < 4:
        return None, None
    return cv2.findHomography(
        pA.reshape(-1, 1, 2).astype(np.float32),
        pB.reshape(-1, 1, 2).astype(np.float32),
        cv2.RANSAC,
        8.0,
        confidence=0.999,
    )

@functools.lru_cache(maxsize=1)
def get_matcher() -> DinoMatcher:
    return DinoMatcher()

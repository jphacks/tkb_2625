from __future__ import annotations

import cv2
import imagehash
import numpy as np
from PIL import Image

FEATURE_NAMES = [
    "embed_cos",
    "embed_cos_center",
    "phash_sim",
    "dhash_sim",
    "hist_corr",
    "match_good",
    "match_inlier_ratio",
    "match_inliers",
    "match_coverage",
    "match_overlap",
    "dino_match",
    "dino_inlier_ratio",
    "dino_inliers",
    "dino_coverage",
    "dino_overlap",
    "dino_cls_cos",
]

def _bgr(img: Image.Image, max_side: int = 960) -> np.ndarray:
    a = cv2.cvtColor(np.asarray(img.convert("RGB")), cv2.COLOR_RGB2BGR)
    h, w = a.shape[:2]
    s = max_side / max(h, w)
    if s < 1.0:
        a = cv2.resize(a, (max(1, int(w * s)), max(1, int(h * s))), interpolation=cv2.INTER_AREA)
    return a

def phash_sim(a: Image.Image, b: Image.Image, hash_size: int = 16) -> float:
    ha, hb = imagehash.phash(a, hash_size), imagehash.phash(b, hash_size)
    return 1.0 - (ha - hb) / (hash_size * hash_size)

def dhash_sim(a: Image.Image, b: Image.Image, hash_size: int = 16) -> float:
    ha, hb = imagehash.dhash(a, hash_size), imagehash.dhash(b, hash_size)
    return 1.0 - (ha - hb) / (hash_size * hash_size)

def hist_corr(a: Image.Image, b: Image.Image) -> float:
    A = cv2.cvtColor(_bgr(a), cv2.COLOR_BGR2HSV)
    B = cv2.cvtColor(_bgr(b), cv2.COLOR_BGR2HSV)
    sims = []
    for ch, (m, bins) in enumerate([(180, 32), (256, 32), (256, 32)]):
        ha = cv2.calcHist([A], [ch], None, [bins], [0, m])
        hb = cv2.calcHist([B], [ch], None, [bins], [0, m])
        cv2.normalize(ha, ha)
        cv2.normalize(hb, hb)
        sims.append(cv2.compareHist(ha, hb, cv2.HISTCMP_CORREL))
    return float(np.mean(sims))

def _coverage(pts: np.ndarray, w: int, h: int, grid: int = 4) -> float:
    if len(pts) == 0:
        return 0.0
    cells = set()
    for x, y in pts:
        cx = min(grid - 1, max(0, int(x / w * grid)))
        cy = min(grid - 1, max(0, int(y / h * grid)))
        cells.add((cx, cy))
    return len(cells) / (grid * grid)

def _overlap(H: np.ndarray, wA: int, hA: int, wB: int, hB: int) -> float:
    if H is None or not np.all(np.isfinite(H)):
        return 0.0
    xs = np.linspace(0.05 * wA, 0.95 * wA, 16)
    ys = np.linspace(0.05 * hA, 0.95 * hA, 16)
    gx, gy = np.meshgrid(xs, ys)
    pts = np.stack([gx.ravel(), gy.ravel(), np.ones(gx.size)], axis=1)
    proj = (H @ pts.T).T
    denom = proj[:, 2:3]
    denom[np.abs(denom) < 1e-9] = 1e-9
    proj = proj[:, :2] / denom
    inside = ((proj[:, 0] > 0) & (proj[:, 0] < wB) & (proj[:, 1] > 0) & (proj[:, 1] < hB)).mean()
    return float(inside)

def match_stats(a: Image.Image, b: Image.Image) -> tuple[float, float, float, float, float]:
    A = cv2.cvtColor(_bgr(a), cv2.COLOR_BGR2GRAY)
    B = cv2.cvtColor(_bgr(b), cv2.COLOR_BGR2GRAY)
    if hasattr(cv2, "AKAZE_create"):
        det = cv2.AKAZE_create(threshold=0.001, nOctaves=4)
        norm = cv2.NORM_HAMMING
    else:
        det = cv2.SIFT_create(nfeatures=4096)
        norm = cv2.NORM_L2
    kpA, deA = det.detectAndCompute(A, None)
    kpB, deB = det.detectAndCompute(B, None)
    if deA is None or deB is None or len(kpA) < 8 or len(kpB) < 8:
        return 0.0, 0.0, 0.0, 0.0, 0.0
    bf = cv2.BFMatcher(norm)
    raw = bf.knnMatch(deA, deB, k=2)
    good = [m for m, n in raw if m.distance < 0.75 * n.distance]
    if len(good) < 4:
        return min(1.0, len(good) / 128), 0.0, 0.0, 0.0, 0.0
    pA = np.float32([kpA[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    pB = np.float32([kpB[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
    H, mask = cv2.findHomography(pA, pB, cv2.RANSAC, 3.0, confidence=0.999)
    inl = int(mask.sum()) if mask is not None else 0
    inl_pts = pB[mask.ravel().astype(bool)].reshape(-1, 2) if mask is not None else np.empty((0, 2))
    hB, wB = B.shape
    cov = _coverage(inl_pts, wB, hB)
    hA, wA = A.shape
    ovl = _overlap(H, wA, hA, wB, hB) if inl >= 4 else 0.0
    return min(1.0, len(good) / 128), inl / len(good), min(1.0, inl / 64), cov, ovl

def center_crop(img: Image.Image, frac: float = 0.6) -> Image.Image:
    w, h = img.size
    cw, ch = max(1, int(w * frac)), max(1, int(h * frac))
    return img.crop(((w - cw) // 2, (h - ch) // 2, (w + cw) // 2, (h + ch) // 2))

def feature_vector(ref: Image.Image, query: Image.Image, embedder=None) -> np.ndarray:
    if embedder is None:
        from .embed import get_embedder

        embedder = get_embedder()
    rf = getattr(ref, "filename", None)
    qf = getattr(query, "filename", None)
    e1 = float(embedder.embed(ref) @ embedder.embed(query))
    e2 = float(
        embedder.embed(center_crop(ref), tag=(rf, "c"))
        @ embedder.embed(center_crop(query), tag=(qf, "c"))
    )
    g, r, i, cov, ovl = match_stats(ref, query)
    from .dino import get_matcher

    matcher = get_matcher()
    dm = matcher.match(ref, query)
    dc = (matcher.cls_cos(ref, query) + 1.0) / 2.0
    return np.array(
        [
            (e1 + 1.0) / 2.0,
            (e2 + 1.0) / 2.0,
            phash_sim(ref, query),
            dhash_sim(ref, query),
            (hist_corr(ref, query) + 1.0) / 2.0,
            g,
            r,
            i,
            cov,
            ovl,
            *dm,
            dc,
        ],
        dtype=np.float64,
    )

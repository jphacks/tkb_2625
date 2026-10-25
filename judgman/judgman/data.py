from __future__ import annotations

from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
import requests
from PIL import Image

UA = {"User-Agent": "judgman/0.1 (image similarity research tool)"}
API = "https://commons.wikimedia.org/w/api.php"
QUERIES = [
    "orienteering control flag",
    "trail signpost forest",
    "forest path junction",
    "rock formation forest",
    "stone cairn",
    "old stone bridge",
    "wooden barn door",
    "church tower",
    "waterfall forest",
    "mountain viewpoint sign",
    "lake shore dock",
    "trail marker",
]
CATEGORIES = [
    "Eiffel Tower",
    "Big Ben",
    "Brandenburg Gate",
    "Tower Bridge",
    "Statue of Liberty",
    "Sagrada Família",
    "Colosseum",
    "Mount Fuji",
    "Tokyo Tower",
    "Sydney Opera House",
    "Golden Gate Bridge",
    "Christ the Redeemer",
    "Brooklyn Bridge",
    "Machu Picchu",
    "Petra",
    "Mont Saint-Michel",
    "Niagara Falls",
    "Chichen Itza",
    "CN Tower",
    "Tokyo Skytree",
    "Blackpool Tower",
    "Charles Bridge",
    "Ponte Vecchio",
    "Rialto Bridge",
    "Stonehenge",
    "Arc de Triomphe",
    "Trevi Fountain",
    "Spanish Steps",
    "Alcatraz",
    "Table Mountain",
    "Sugarloaf Mountain",
    "Uluru",
    "Petronas Towers",
    "Burj Khalifa",
    "Hollywood Sign",
    "Little Mermaid Copenhagen",
]
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

def fetch_category_samples(out_dir: Path, per_cat: int = 5, width: int = 640) -> int:
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    for ci, cat in enumerate(CATEGORIES):
        try:
            r = requests.get(
                API,
                params={
                    "action": "query",
                    "format": "json",
                    "generator": "categorymembers",
                    "gcmtitle": f"Category:{cat}",
                    "gcmtype": "file",
                    "gcmlimit": str(per_cat * 4),
                    "prop": "imageinfo",
                    "iiprop": "url|mime|size",
                    "iiurlwidth": str(width),
                },
                timeout=30,
                headers=UA,
            )
            pages = r.json().get("query", {}).get("pages", {})
        except Exception:
            continue
        got = 0
        for p in sorted(pages.values(), key=lambda x: x.get("index", 0)):
            if got >= per_cat:
                break
            ii = p.get("imageinfo", [{}])[0]
            if ii.get("mime") != "image/jpeg" or ii.get("width", 0) < 400:
                continue
            url = ii.get("thumburl") or ii.get("url")
            if not url:
                continue
            try:
                data = requests.get(url, timeout=30, headers=UA).content
                img = Image.open(BytesIO(data)).convert("RGB")
            except Exception:
                continue
            img.save(out_dir / f"cat{ci:02d}_{got:02d}.jpg", quality=92)
            got += 1
            count += 1
    return count

def fetch_samples(out_dir: Path, per_query: int = 3, width: int = 640) -> int:
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    for qi, q in enumerate(QUERIES):
        try:
            r = requests.get(
                API,
                params={
                    "action": "query",
                    "format": "json",
                    "generator": "search",
                    "gsrsearch": f"filetype:bitmap {q}",
                    "gsrnamespace": "6",
                    "gsrlimit": str(per_query),
                    "prop": "imageinfo",
                    "iiprop": "url|size|mime",
                    "iiurlwidth": str(width),
                },
                timeout=30,
                headers=UA,
            )
            pages = r.json().get("query", {}).get("pages", {})
        except Exception:
            continue
        for p in pages.values():
            ii = p.get("imageinfo", [{}])[0]
            if ii.get("mime") not in {"image/jpeg", "image/png"}:
                continue
            url = ii.get("thumburl") or ii.get("url")
            if not url:
                continue
            try:
                data = requests.get(url, timeout=30, headers=UA).content
                img = Image.open(BytesIO(data)).convert("RGB")
            except Exception:
                continue
            stem = f"wm{qi:02d}_{count:03d}"
            img.save(out_dir / f"{stem}.jpg", quality=92)
            count += 1
    return count

def synth_scenes(out_dir: Path, n: int = 24, seed: int = 1) -> int:
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(seed)
    for i in range(n):
        h, w = 480, 640
        canvas = np.full((h, w, 3), int(rng.integers(30, 220)), np.uint8)
        for _ in range(int(rng.integers(6, 16))):
            color = tuple(int(c) for c in rng.integers(0, 256, 3))
            kind = rng.integers(0, 3)
            if kind == 0:
                pts = rng.integers(0, [w, h], (int(rng.integers(3, 7)), 2)).astype(np.int32)
                cv2.fillPoly(canvas, [pts], color)
            elif kind == 1:
                c = (int(rng.integers(0, w)), int(rng.integers(0, h)))
                cv2.circle(canvas, c, int(rng.integers(15, 120)), color, -1)
            else:
                p1 = (int(rng.integers(0, w)), int(rng.integers(0, h)))
                p2 = (int(rng.integers(0, w)), int(rng.integers(0, h)))
                cv2.line(canvas, p1, p2, color, int(rng.integers(2, 20)))
        cv2.putText(
            canvas,
            f"CP{i:02d}",
            (int(rng.integers(10, 300)), int(rng.integers(60, 420))),
            cv2.FONT_HERSHEY_SIMPLEX,
            2.0,
            tuple(int(c) for c in rng.integers(0, 256, 3)),
            4,
        )
        cv2.imwrite(str(out_dir / f"synth{i:03d}.jpg"), canvas)
    return n

def load_images(data_dir: Path) -> list[Path]:
    return sorted(p for p in Path(data_dir).iterdir() if p.suffix.lower() in EXTS)

def augment(img: Image.Image, rng: np.random.Generator) -> Image.Image:
    a = cv2.cvtColor(np.asarray(img.convert("RGB")), cv2.COLOR_RGB2BGR)
    h, w = a.shape[:2]
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = (src + rng.uniform(-0.12, 0.12, (4, 2)) * np.array([w, h])).astype(np.float32)
    a = cv2.warpPerspective(a, cv2.getPerspectiveTransform(src, dst), (w, h), borderMode=cv2.BORDER_REPLICATE)
    M = cv2.getRotationMatrix2D((w / 2, h / 2), float(rng.uniform(-15, 15)), float(rng.uniform(0.8, 1.0)))
    a = cv2.warpAffine(a, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
    a = cv2.convertScaleAbs(a, alpha=float(rng.uniform(0.7, 1.3)), beta=float(rng.uniform(-30, 30)))
    if rng.random() < 0.5:
        a = cv2.GaussianBlur(a, (0, 0), float(rng.uniform(0.5, 1.5)))
    if rng.random() < 0.5:
        a = np.clip(a + rng.normal(0, 6, a.shape), 0, 255).astype(np.uint8)
    _, buf = cv2.imencode(".jpg", a, [cv2.IMWRITE_JPEG_QUALITY, int(rng.integers(45, 95))])
    a = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    return Image.fromarray(cv2.cvtColor(a, cv2.COLOR_BGR2RGB))

def group_images(images: list[Path]) -> list[list[Path]]:
    groups: dict[str, list[Path]] = {}
    for p in images:
        key = p.stem[:5] if p.stem.startswith("cat") else f"single_{p.stem}"
        groups.setdefault(key, []).append(p)
    return list(groups.values())

def make_grouped_pairs(groups: list[list[Path]], n_same: int, n_aug: int, n_neg: int, seed: int = 0):
    rng = np.random.default_rng(seed)
    multi = [g for g in groups if len(g) >= 2]
    all_imgs = [p for g in groups for p in g]
    pairs = []
    for _ in range(n_same):
        g = multi[int(rng.integers(0, len(multi)))]
        i, j = rng.choice(len(g), size=2, replace=False)
        pairs.append((Image.open(g[i]), Image.open(g[j]), 1))
    for _ in range(n_aug):
        p = all_imgs[int(rng.integers(0, len(all_imgs)))]
        img = Image.open(p)
        pairs.append((img, augment(img, rng), 1))
    tries = 0
    made = 0
    while made < n_neg and tries < n_neg * 20:
        tries += 1
        gi, gj = rng.choice(len(groups), size=2, replace=False)
        if groups[gi] and groups[gj] and groups[gi] is not groups[gj]:
            a = groups[gi][int(rng.integers(0, len(groups[gi])))]
            b = groups[gj][int(rng.integers(0, len(groups[gj])))]
            pairs.append((Image.open(a), Image.open(b), 0))
            made += 1
    return pairs

def make_pairs(images: list[Path], n_pos: int, n_neg: int, seed: int = 0):
    rng = np.random.default_rng(seed)
    pairs = []
    for k in range(n_pos):
        p = images[int(rng.integers(0, len(images)))]
        img = Image.open(p)
        pairs.append((img, augment(img, rng), 1))
    for _ in range(n_neg):
        i, j = rng.choice(len(images), size=2, replace=False)
        pairs.append((Image.open(images[i]), Image.open(images[j]), 0))
    return pairs

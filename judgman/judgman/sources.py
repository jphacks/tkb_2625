from __future__ import annotations

from io import BytesIO

import requests
from PIL import Image

UA = {"User-Agent": "judgman/0.1 (rogaining arrival judge)"}

def load_image(path_or_url: str) -> Image.Image:
    if str(path_or_url).startswith(("http://", "https://")):
        r = requests.get(str(path_or_url), timeout=60, headers=UA)
        r.raise_for_status()
        img = Image.open(BytesIO(r.content))
    else:
        img = Image.open(path_or_url)
    img.load()
    img.filename = str(path_or_url)
    return img

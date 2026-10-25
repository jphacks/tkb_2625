from __future__ import annotations

import functools
from typing import Hashable

import numpy as np
import torch
from PIL import Image
from torchvision import transforms
from torchvision.models import ResNet50_Weights, resnet50

class Embedder:
    def __init__(self) -> None:
        w = ResNet50_Weights.IMAGENET1K_V2
        net = resnet50(weights=w).eval()
        net.fc = torch.nn.Identity()
        self.net = net
        t = w.transforms()
        self.tf = transforms.Compose(
            [
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(t.mean, t.std),
            ]
        )
        self._cache: dict[Hashable, np.ndarray] = {}

    def embed(self, img: Image.Image, tag: Hashable | None = None) -> np.ndarray:
        key = tag if tag is not None else getattr(img, "filename", None)
        if key is not None and key in self._cache:
            return self._cache[key]
        x = self.tf(img.convert("RGB")).unsqueeze(0)
        with torch.inference_mode():
            v = self.net(x)
        v = (v / v.norm(dim=1, keepdim=True)).squeeze(0).numpy()
        if key is not None:
            if len(self._cache) > 4096:
                self._cache.clear()
            self._cache[key] = v
        return v

@functools.lru_cache(maxsize=1)
def get_embedder() -> Embedder:
    return Embedder()

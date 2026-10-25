from __future__ import annotations

from pathlib import Path

import numpy as np
import torch
import torch.nn as nn

class LIFLayer(nn.Module):
    def __init__(self, fin: int, fout: int, tau: float, vth: float, width: float) -> None:
        super().__init__()
        self.lin = nn.Linear(fin, fout)
        self.tau = tau
        self.vth = vth
        self.width = width

    def forward(self, seq: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        T, B, _ = seq.shape
        V = torch.zeros(B, self.lin.out_features)
        spikes, vols = [], []
        for t in range(T):
            V = self.tau * V + self.lin(seq[t])
            s_hard = (V > self.vth).float()
            s_soft = torch.sigmoid((V - self.vth) / self.width)
            s = s_hard - s_soft.detach() + s_soft
            V = V * (1.0 - s_hard.detach())
            spikes.append(s)
            vols.append(V)
        return torch.stack(spikes), torch.stack(vols)

class SNNNet(nn.Module):
    def __init__(self, fin: int = 8, h1: int = 64, h2: int = 32, T: int = 24,
                 tau: float = 0.7, vth: float = 1.0, width: float = 0.5, gain: float = 2.0,
                 poisson: bool = False) -> None:
        super().__init__()
        self.T = T
        self.gain = gain
        self.poisson = poisson
        self.l1 = LIFLayer(fin, h1, tau, vth, width)
        self.l2 = LIFLayer(h1, h2, tau, vth, width)
        self.out = nn.Linear(h2, 1)

    def encode(self, x: torch.Tensor, gen: torch.Generator) -> torch.Tensor:
        if self.poisson:
            rate = (x * self.gain).clamp(0.0, 1.0)
            r = torch.rand(self.T, *rate.shape, generator=gen)
            return (r < rate.unsqueeze(0)).float()
        return (x * self.gain).unsqueeze(0).expand(self.T, *x.shape).contiguous()

    def forward(self, x: torch.Tensor, gen: torch.Generator) -> torch.Tensor:
        s1, _ = self.l1(self.encode(x, gen))
        _, V2 = self.l2(s1)
        return self.out(V2.mean(0)).squeeze(1)

class SNN:
    def __init__(self, fin: int = 8, T: int = 24, seed: int = 0) -> None:
        self.fin = fin
        self.T = T
        self.seed = seed
        self.net: SNNNet | None = None

    def fit(self, X: np.ndarray, y: np.ndarray, epochs: int = 600, lr: float = 1e-2,
            batch: int = 64, seed: int = 1234) -> float:
        torch.manual_seed(seed)
        net = SNNNet(fin=self.fin, T=self.T)
        opt = torch.optim.Adam(net.parameters(), lr=lr, weight_decay=1e-4)
        lossf = nn.BCEWithLogitsLoss()
        Xt = torch.tensor(X, dtype=torch.float32)
        yt = torch.tensor(y, dtype=torch.float32)
        g = torch.Generator().manual_seed(seed)
        n = len(Xt)
        net.train()
        last = float("nan")
        for _ in range(epochs):
            perm = torch.randperm(n, generator=g)
            total = 0.0
            for i in range(0, n, batch):
                idx = perm[i : i + batch]
                bg = torch.Generator().manual_seed(seed + i)
                xb = Xt[idx] + 0.05 * torch.randn(Xt[idx].shape, generator=bg)
                xb = xb.clamp(0.0, 1.0)
                logits = net(xb, bg)
                loss = lossf(logits, yt[idx])
                opt.zero_grad()
                loss.backward()
                opt.step()
                total += float(loss.detach()) * len(idx)
            last = total / n
        self.net = net.eval()
        return last

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if self.net is None:
            raise RuntimeError("SNN not trained/loaded")
        Xt = torch.tensor(np.atleast_2d(X), dtype=torch.float32)
        g = torch.Generator().manual_seed(self.seed)
        with torch.no_grad():
            logits = self.net(Xt, g)
            p = torch.sigmoid(logits)
        return p.numpy()

    def save(self, path: Path) -> None:
        if self.net is None:
            return
        torch.save({"state_dict": self.net.state_dict(), "T": self.T, "fin": self.fin}, path)

    def load(self, path: Path) -> None:
        d = torch.load(path, weights_only=True)
        net = SNNNet(fin=d["fin"], T=d["T"])
        net.load_state_dict(d["state_dict"])
        self.net = net.eval()
        self.T = d["T"]
        self.fin = d["fin"]

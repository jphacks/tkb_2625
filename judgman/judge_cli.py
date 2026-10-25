
"""judge-wrapper 連携用CLI。

使い方: python judge_cli.py <判定対象画像URL/パス> <CP参照画像URL/パス> [参照2 ...]
終了コード 0 = ARRIVED(到達)、1 = NOT_ARRIVED、2 = 使い方のエラー
stdout に判定結果JSONを出力する。
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from judgman.judge import Judgman

def main(argv: list[str]) -> int:
    if len(argv) < 3:
        print("usage: judge_cli.py <query image> <ref image> [ref image ...]", file=sys.stderr)
        return 2
    query, refs = argv[1], argv[2:]
    j = Judgman()
    result = j.score_control(refs, query)
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result["verdict"] == "ARRIVED" else 1

if __name__ == "__main__":
    sys.exit(main(sys.argv))

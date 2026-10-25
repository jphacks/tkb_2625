"""judge-wrapper 連携用CLI。"""
from __future__ import annotations

import json
import os
import sys
import logging
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from judgman.judge import Judgman
from judgement import *
from fetch import FetchImage

snn_j = Judgman()
sift_j = HybridLocationVerifier()
fetchimg = FetchImage()

def main(argv: list[str]) -> int:
    if len(argv) < 3:
        print("usage: main.py <model_num> <query image url> <ref image url> [ref ...]", file=sys.stderr)
        return 2
    try:
        model_num = int(argv[1])
    except (ValueError, TypeError):
        print("model_num must be 0 or 1", file=sys.stderr)
        return 2
    if model_num not in (0, 1):
        print("model_num must be 0 or 1", file=sys.stderr)
        return 2

    query_url, refs_url = argv[2], argv[3:]
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    try:
        match model_num:
            case 0:
                query = fetchimg.getphoto_bytes(query_url)
                refs = [fetchimg.getphoto_bytes(i) for i in refs_url]
                result = snn_j.score_control(refs, query)
                print(json.dumps(result, ensure_ascii=False))
                return 0 if result["verdict"] == "ARRIVED" else 1

            case 1:
                query = fetchimg.getphoto_bytes(query_url)
                refs = [fetchimg.getphoto_bytes(i) for i in refs_url]
                result = sift_j.verify(refs, query)
                print("\n=== 判定結果 ===")
                print(f"結果: {result.verdict}")
                print(f"詳細: {result.details}")
                return 0 if result.verdict == Verdict.MATCH else 1

    except (requests.RequestException, ValueError, Exception):
        logger.exception("画像の取得・判定に失敗しました")
        return 2
    finally:
        fetchimg.close()

if __name__ == "__main__":
    sys.exit(main(sys.argv))

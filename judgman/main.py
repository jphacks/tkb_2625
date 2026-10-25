
"""judge-wrapper 連携用CLI。
使い方: python main.py <判定モデル番号> <判定対象画像URL> <CP参照画像URL> [参照2 ...]
終了コード 0 = apprived(一致)、1 = not_approved(不一致)、2 = その他エラー
stdout に判定結果を出力する。
"""
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
sift_j =  HybridLocationVerifier()
fetchimg = FetchImage()

def main(argv: list[str]) -> int:
    if len(argv) < 3:
        print("usage: judge_cli.py <model_nun> <query image> <ref image> [ref image ...]", file=sys.stderr)
        return 2
    query_url, refs_url = argv[2], argv[3:]
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    try:
        match argv[1]:
            case 0:                
                query = fetchimg.getphoto_bytes(query_url)
                refs = [fetchimg.getphoto_bytes(i) for i in refs_url]
                result = snn_j.score_control(refs, query)
                print(json.dumps(result, ensure_ascii=False))
                return 0 if result["verdict"] == "ARRIVED" else 1

            case 1:
                query = fetchimg.getphoto_rgb(query_url)
                refs = [fetchimg.getphoto_rgb(i) for i in refs_url]
                result = verifier.verify(ref_images, query_path)
                print("\n=== 判定結果 ===")
                print(f"結果: {result.verdict}")
                print(f"詳細: {result.details}")
                return 0 if result.verdict == MATCH else 1

    except (requests.RequestException, ValueError, cv2.error):
        logger.exception("画像の取得・変換に失敗しました")
        sys.exit(2)
    finally:
        fetchimg.close()

if __name__ == "__main__":
    sys.exit(main(sys.argv))

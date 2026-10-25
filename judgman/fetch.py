
"""urlから画像を取得して返すクラス。動くかのテストをするときは `python3 fetch.py <url>` をする。
fetchimg = FetchImage()
logging.basicConfig(level=logging.INFO)
try:
    img = fetchimg.getphoto(sys.argv[1])
except (requests.RequestException, ValueError, cv2.error):
    logger.exception("画像の取得・変換に失敗しました")
    sys.exit(2)
finally:
    fetchimg.close()

のように使う。
"""
import logging
import sys

import cv2
import numpy as np
import requests

logger = logging.getLogger(__name__)

class FetchImage:
    """httpリクエストで画像を取得し、RGB形式の画像を返すクラス"""

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "judgman/0.1 (rogaining arrival judge)"})

    def close(self) -> None:
        """HTTPセッションを閉じ、接続資源を解放する。"""
        self.session.close()

    def fetchlink(self, url):
        """httpリクエストでコンテンツを取得

        Args:
            url: 画像データを返すURLのテキスト
        Returns:
            response: httpリクエストのレスポンス
        """
        response = self.session.get(url, timeout=self.timeout)
        if response.status_code != 200:
            err = Exception(
                "httpリクエストでエラーが起こりました。ステータスコード: " + str(response.status_code) + "\n" + url
            )
            logger.exception(err)
            raise err
        return response

    def check_data(self, response) -> None:
        """httpリクエストで取得したコンテンツが画像か確認する

        Args:
            response: httpリクエストのレスポンス
        Returns:
            None
        """
        content_type = response.headers.get("content-type", "")
        if "image" not in content_type:
            err = Exception("エラーが起こりました。HTMLに画像がありません: " + str(content_type))
            logger.exception(err)
            raise err

    def transfar_image(self, contents: bytes):
        """httpリクエストのコンテンツをRGB形式の画像に変換する

        Args:
            contents: httpリクエストで取得したコンテンツ(bytes)
        Returns:
            img_rgb: 画像データ(RGB)
        """
        buf = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if image is None:
            err = Exception("画像のデコードに失敗しました")
            logger.exception(err)
            raise err
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        return img_rgb

    def getphoto_rgb(self, url):
        """httpリクエストを送り帰ってきた画像をRGB形式で返す

        Args:
            url: httpリクエストを送りたいurl
        Returns:
            img_rgb: 画像データ(RGB)
        """
        response = self.fetchlink(url)
        self.check_data(response)
        img_rgb = self.transfar_image(response.content)
        return img_rgb

    def getphoto_bytes(self,url):
        """httpリクエストを送り帰ってきた画像をRGB形式で返す

        Args:
            url: httpリクエストを送りたいurl
        Returns:
            img_bytes: 画像データ(バイト列)
        """
        response = self.fetchlink(url)
        self.check_data(response)
        img_bytes = response.content
        return img_bytes

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: python3 fetch.py <image url>")
        sys.exit(2)
    logging.basicConfig(level=logging.INFO)
    fetchimg = FetchImage()
    try:
        img = fetchimg.getphoto(sys.argv[1])
        img = fetchimg.getphoto(sys.argv[1])
        cv2.imshow("img", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        cv2.waitKey(0)
    except (requests.RequestException, ValueError, cv2.error):
        logger.exception("画像の取得・変換に失敗しました")
        sys.exit(2)
    finally:
        fetchimg.close()
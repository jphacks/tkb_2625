import sys
import cv2
import numpy as np
import requests
import logging
import datetime

logger = logging.getLogger(__name__)

class FetchImage:
    """httpリクエストで画像を取得し、RGB形式の画像を返すクラス
    """
    def __init__(self,timeout,)
    def fetchlink(self,url):
        """httpリクエストでコンテンツを取得
        Args:
            url: 画像データを返すURLのテキスト
        Returns:
            response: httpリクエストのレスポンス
        """
        response = requests.get(url)
        if response.status_code != 200:
            err = Exception("httpリクエストでエラーが起こりました。ステータスコード: " + str(response.status_code) + "\n" + url)
            logger.exception(err)
            raise err
        return response

    def check_data(self,response) -> None:
        """httpリクエストで取得したコンテンツが画像か確認する
        Arges:
            response: httpリクエストのレスポンス
        Return:
            None
        """
        content_type = response.headers["content-type"]
        if "image" not in content_type:
            err = Exception("エラーが起こりました。HTMLに画像がありません: " + str(content_type))
            logger.exception(err)
            raise err
         
    def transfar_image(self,contents):
        """httpリクエストのコンテンツをRGB形式の画像を返す
        Args:
            contents: httpリクエストで取得したコンテンツ
        Returns:
            img_rgb: 画像データ(RGB)
        """
        image = cv2.imread(contents)
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        return img_rgb
    
    def getphoto(self,url):
        """httpリクエストを送り帰ってきた画像をRGB形式で返す
        Args:
            url: httpリクエストを送りたいurl
        Returns:
            img_rgb: 画像データ(RGB)
        """
        response = self.fetchlink(url)
        self.check_data(response)
        contents = response.content
        img_rgb = self.transfar_image(contents)
        return img_rgb

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("usage: python3 fetch.py url")
    sys.exit(-1)
    url = sys.argv[1]
    fetchimg = FetchImage()
    img = fetchimg.getphoto(url)
    cv2.imshow("img", img)
    key = cv2.waitKey(0)

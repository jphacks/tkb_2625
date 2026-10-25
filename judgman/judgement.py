import os
import sys
import cv2
import numpy as np
import torch
import torchvision.transforms as T
from PIL import Image
from dataclasses import dataclass
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

class Verdict:
    MATCH = "一致"
    MISMATCH = "不一致"
    UNCERTAIN = "判定保留"

@dataclass
class SIFTResult:
    num_ref_keypoints: int
    num_query_keypoints: int
    num_matches: int
    num_inliers: int
    inlier_ratio: float
    homography_found: bool

@dataclass
class DINOv2Result:
    cosine_similarity: float

@dataclass
class EvaluationResult:
    verdict: str
    sift_result: SIFTResult
    dino_result: DINOv2Result
    details: str

class SIFTMatcher:
    def __init__(self, ratio_thresh: float = 0.80, ransac_reproj_thresh: float = 8.0):
        self.sift = cv2.SIFT_create()
        self.ratio_thresh = ratio_thresh
        self.ransac_reproj_thresh = ransac_reproj_thresh

    def match(self, ref_img_bgr: np.ndarray, query_img_bgr: np.ndarray) -> SIFTResult:
        gray_ref = cv2.cvtColor(ref_img_bgr, cv2.COLOR_BGR2GRAY)
        gray_query = cv2.cvtColor(query_img_bgr, cv2.COLOR_BGR2GRAY)

        kp1, des1 = self.sift.detectAndCompute(gray_ref, None)
        kp2, des2 = self.sift.detectAndCompute(gray_query, None)

        if des1 is None or des2 is None or len(kp1) < 4 or len(kp2) < 4:
            return SIFTResult(
                num_ref_keypoints=len(kp1) if kp1 else 0,
                num_query_keypoints=len(kp2) if kp2 else 0,
                num_matches=0,
                num_inliers=0,
                inlier_ratio=0.0,
                homography_found=False
            )

        bf = cv2.BFMatcher(cv2.NORM_L2)
        matches = bf.knnMatch(des1, des2, k=2)

        good_matches = []
        for match in matches:
            if len(match) == 2:
                m, n = match
                if m.distance < self.ratio_thresh * n.distance:
                    good_matches.append(m)

        if len(good_matches) < 4:
            return SIFTResult(
                num_ref_keypoints=len(kp1),
                num_query_keypoints=len(kp2),
                num_matches=len(good_matches),
                num_inliers=0,
                inlier_ratio=0.0,
                homography_found=False
            )

        src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

        H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, self.ransac_reproj_thresh)

        inliers_count = int(np.sum(mask)) if mask is not None else 0
        inlier_ratio = inliers_count / len(good_matches) if len(good_matches) > 0 else 0.0

        return SIFTResult(
            num_ref_keypoints=len(kp1),
            num_query_keypoints=len(kp2),
            num_matches=len(good_matches),
            num_inliers=inliers_count,
            inlier_ratio=inlier_ratio,
            homography_found=(H is not None and inliers_count >= 4)
        )

class DINOv2Extractor:
    def __init__(self, model_name: str = 'dinov2_vits14', device: Optional[str] = None):
        self.device = 'cpu'
        self.model = torch.hub.load('facebookresearch/dinov2', model_name)
        self.model.eval().to(self.device)

        self.transform = T.Compose([
            T.Resize((224, 224), interpolation=T.InterpolationMode.BICUBIC),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    @torch.no_grad()
    def extract_vector(self, pil_img: Image.Image) -> torch.Tensor:
        tensor = self.transform(pil_img.convert('RGB')).unsqueeze(0).to(self.device)
        features = self.model(tensor)
        features = torch.nn.functional.normalize(features, p=2, dim=1)
        return features.squeeze(0)

    def compare(self, ref_pil: Image.Image, query_pil: Image.Image) -> DINOv2Result:
        vec_ref = self.extract_vector(ref_pil)
        vec_query = self.extract_vector(query_pil)
        cos_sim = float(torch.dot(vec_ref, vec_query).item())
        return DINOv2Result(cosine_similarity=cos_sim)

class HybridLocationVerifier:
    def __init__(
        self,
        sift_inlier_match_thresh: int = 8,
        sift_ratio_match_thresh: float = 0.15,
        sift_inlier_mismatch_thresh: int = 3,
        dino_sim_match_thresh: float = 0.65,
        dino_sim_mismatch_thresh: float = 0.45,
        device: Optional[str] = None
    ):
        self.sift_matcher = SIFTMatcher()
        self.dino_extractor = DINOv2Extractor(device=device)

        self.sift_inlier_match_thresh = sift_inlier_match_thresh
        self.sift_ratio_match_thresh = sift_ratio_match_thresh
        self.sift_inlier_mismatch_thresh = sift_inlier_mismatch_thresh
        self.dino_sim_match_thresh = dino_sim_match_thresh
        self.dino_sim_mismatch_thresh = dino_sim_mismatch_thresh

    def verify(self, refs, query) -> EvaluationResult:
        from io import BytesIO

        def _open_img(x):
            if isinstance(x, (bytes, bytearray)):
                return Image.open(BytesIO(bytes(x)))
            if isinstance(x, str):
                with open(x, "rb") as f:
                    return Image.open(BytesIO(f.read()))
            return Image.open(x)

        def _to_bytes(x):
            if isinstance(x, (bytes, bytearray)):
                return bytes(x)
            if isinstance(x, str):
                with open(x, "rb") as f:
                    return f.read()
            return x

        query_bytes = _to_bytes(query)
        query_pil = _open_img(query)
        query_bgr = self.image_converter(query_bytes)

        best_sift_res = SIFTResult(0, 0, 0, 0, 0.0, False)
        best_dino_res = DINOv2Result(-1.0)

        for ref in refs:
            ref_bytes = _to_bytes(ref)
            ref_pil = _open_img(ref)
            ref_bgr = self.image_converter(ref_bytes)

            sift_res = self.sift_matcher.match(ref_bgr, query_bgr)
            dino_res = self.dino_extractor.compare(ref_pil, query_pil)

            if sift_res.num_inliers > best_sift_res.num_inliers or dino_res.cosine_similarity > best_dino_res.cosine_similarity:
                if sift_res.num_inliers >= best_sift_res.num_inliers:
                    best_sift_res = sift_res
                if dino_res.cosine_similarity >= best_dino_res.cosine_similarity:
                    best_dino_res = dino_res

        verdict = self._determine_verdict(best_sift_res, best_dino_res)

        details = (
            f"SIFT Inliers: {best_sift_res.num_inliers} (Ratio: {best_sift_res.inlier_ratio:.2f}) | "
            f"DINOv2 Cosine Sim: {best_dino_res.cosine_similarity:.4f}"
        )

        return EvaluationResult(
            verdict=verdict,
            sift_result=best_sift_res,
            dino_result=best_dino_res,
            details=details
        )

    def _determine_verdict(self, sift: SIFTResult, dino: DINOv2Result) -> str:
        is_sift_pass = (sift.num_inliers >= self.sift_inlier_match_thresh) and (sift.inlier_ratio >= self.sift_ratio_match_thresh)
        is_dino_pass = dino.cosine_similarity >= self.dino_sim_match_thresh

        if is_sift_pass and is_dino_pass:
            return Verdict.MATCH

        if dino.cosine_similarity >= 0.70 and sift.num_inliers >= 4:
            return Verdict.MATCH

        if sift.num_inliers >= 12 and sift.inlier_ratio >= 0.20:
            return Verdict.MATCH

        if sift.num_inliers < self.sift_inlier_mismatch_thresh and dino.cosine_similarity < self.dino_sim_mismatch_thresh:
            return Verdict.MISMATCH

        return Verdict.UNCERTAIN
    
    def image_converter(self,image_bytes:bytes) -> np.array:
        buf = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if image is None:
            err = Exception("画像のデコードに失敗しました")
            logger.exception(err)
            raise err
        return image

def get_ref_images_from_dir(point_dir: str) -> List[str]:
    valid_exts = ('.jpg', '.jpeg', '.png', '.webp', '.bmp', '.JPG', '.JPEG', '.PNG', '.WEBP', '.BMP')
    if not os.path.isdir(point_dir):
        return []
    
    ref_paths = [
        os.path.join(point_dir, fname)
        for fname in os.listdir(point_dir)
        if fname.endswith(valid_exts)
    ]
    return sorted(ref_paths)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 main.py <ポイントディレクトリ> <判定対象画像パス>")
        print("例: python3 main.py point-1 /home/cesta/Pictures/Screenshots/screenshot-20261024-130456.png")
        sys.exit(1)

    point_dir = sys.argv[1]
    query_path = sys.argv[2]

    if not os.path.exists(point_dir):
        print(f"Error: チェックポイントディレクトリが見つかりません -> {point_dir}")
        sys.exit(1)

    ref_images = get_ref_images_from_dir(point_dir)
    if not ref_images:
        print(f"Error: ディレクトリ '{point_dir}' 内に基準画像が見つかりません。")
        sys.exit(1)

    if not os.path.exists(query_path):
        print(f"Error: 判定対象画像が見つかりません -> {query_path}")
        sys.exit(1)

    print(f"[*] チェックポイント '{point_dir}' 内の {len(ref_images)} 枚の基準画像と照合します...")

    verifier = HybridLocationVerifier()
    result = verifier.verify(ref_images, query_path)

    print("\n=== 判定結果 ===")
    print(f"結果: {result.verdict}")
    print(f"詳細: {result.details}")

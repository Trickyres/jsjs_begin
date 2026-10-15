"""Read source JPEG GPS tags as supporting location evidence; never edit sources."""

import contextlib
import io
import json
import runpy
import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path("E:/OneDrive/Desktop/稼享指南网页版本/稼享指南网页/20261013_重命名图片")
class CapturedOutput(io.StringIO):
    def reconfigure(self, **kwargs):
        pass


with contextlib.redirect_stdout(CapturedOutput()):
    helpers = runpy.run_path(str(ROOT / "review-drafts/2026-10-point-photos/check-jpg-gps.py"))

PAIRS = [
    ("传统牛肉面", "traditional-beef-noodles", 121.50125, 31.21243),
    ("瓜牛便利店", "guaniu-convenience", 121.50622, 31.212472),
    ("红烧牛肉面", "beef-noodles-lamb-soup-yangguangli", 121.50049, 31.212606),
    ("烧腊卤味饭堂", "roast-meat-rice-canteen", 121.500786, 31.212633),
    ("中泰证券大厦", "zhongtai-securities", 121.504206, 31.2122),
    ("过水鱼馆", "guoshuiyuguan", 121.501158, 31.212449),
]

records = []
for name, point_id, point_lng, point_lat in PAIRS:
    source_path = SOURCE / (name + ".jpg")
    with Image.open(source_path) as photo:
        gps = photo.getexif().get_ifd(34853)
        record = {"sourcePath": str(source_path), "pointId": point_id,
                  "pointGcj02": {"lng": point_lng, "lat": point_lat}}
        if 2 not in gps or 4 not in gps:
            record["gps"] = None
        else:
            lat = helpers["decimal"](gps[2], gps.get(1, "N"))
            lng = helpers["decimal"](gps[4], gps.get(3, "E"))
            gcj_lng, gcj_lat = helpers["wgs84_to_gcj02"](lng, lat)
            record.update({
                "datum": str(gps.get(18, "not recorded; WGS-84 assumed")),
                "horizontalError": str(gps.get(31, "not recorded")),
                "wgs84": {"lng": lng, "lat": lat},
                "gcj02": {"lng": gcj_lng, "lat": gcj_lat},
                "distanceM": round(helpers["distance"](gcj_lng, gcj_lat, point_lng, point_lat), 1),
            })
        records.append(record)

print(json.dumps(records, ensure_ascii=False, indent=2))

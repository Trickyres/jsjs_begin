"""Read original JPEG GPS metadata and compare with existing GCJ-02 points.

Reads source images and points-data.js only. Prints results; writes no image data.
"""

import json
import math
import re
import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path("E:/OneDrive/Desktop/稼享指南网页版本/稼享指南网页/20261013_重命名图片")
PAIRS = [
    ("浦发银行", "spdb"),
    ("招商银行", "cmb"),
    ("上海银行", "shanghai-bank"),
    ("中国银行", "boc"),
    ("国海证券", "guohai-sec"),
    ("豪祥名烟名酒", "haoxiang"),
]


def decimal(parts, ref):
    value = float(parts[0]) + float(parts[1]) / 60 + float(parts[2]) / 3600
    return -value if ref in ("S", "W") else value


def wgs84_to_gcj02(lng, lat):
    """Standard GCJ-02 forward conversion; input/output in decimal degrees."""
    if not (72.004 <= lng <= 137.8347 and 0.8293 <= lat <= 55.8271):
        return lng, lat
    x, y = lng - 105, lat - 35
    dlat = -100 + 2*x + 3*y + 0.2*y*y + 0.1*x*y + 0.2*math.sqrt(abs(x))
    dlat += (20*math.sin(6*x*math.pi) + 20*math.sin(2*x*math.pi)) * 2/3
    dlat += (20*math.sin(y*math.pi) + 40*math.sin(y/3*math.pi)) * 2/3
    dlat += (160*math.sin(y/12*math.pi) + 320*math.sin(y*math.pi/30)) * 2/3
    dlng = 300 + x + 2*y + 0.1*x*x + 0.1*x*y + 0.1*math.sqrt(abs(x))
    dlng += (20*math.sin(6*x*math.pi) + 20*math.sin(2*x*math.pi)) * 2/3
    dlng += (20*math.sin(x*math.pi) + 40*math.sin(x/3*math.pi)) * 2/3
    dlng += (150*math.sin(x/12*math.pi) + 300*math.sin(x/30*math.pi)) * 2/3
    radlat = lat / 180 * math.pi
    magic = 1 - 0.00669342162296594323 * math.sin(radlat)**2
    sqrtmagic = math.sqrt(magic)
    dlat = dlat*180 / ((6378245*(1-0.00669342162296594323)/(magic*sqrtmagic))*math.pi)
    dlng = dlng*180 / ((6378245/sqrtmagic)*math.cos(radlat)*math.pi)
    return lng+dlng, lat+dlat


def distance(a_lng, a_lat, b_lng, b_lat):
    r = 6371008.8
    lat1, lat2 = math.radians(a_lat), math.radians(b_lat)
    dlat, dlng = lat2-lat1, math.radians(b_lng-a_lng)
    h = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlng/2)**2
    return 2*r*math.asin(math.sqrt(h))


script = (ROOT / "points-data.js").read_text(encoding="utf-8")
script = re.sub(r"^\s*//.*$", "", script, flags=re.M)
points = json.loads(re.search(r"window\.POINTS_DATA\s*=\s*(\[.*\]);", script, re.S).group(1))
by_id = {point["id"]: point for point in points}
results = []
for filename, point_id in PAIRS:
    path = SOURCE / (filename + ".jpg")
    with Image.open(path) as im:
        exif = im.getexif()
        gps = exif.get_ifd(34853)
        if not gps or 2 not in gps or 4 not in gps:
            results.append({"file": path.name, "point_id": point_id, "gps": None})
            continue
        lat = decimal(gps[2], gps.get(1, "N"))
        lng = decimal(gps[4], gps.get(3, "E"))
        gcj_lng, gcj_lat = wgs84_to_gcj02(lng, lat)
        point = by_id[point_id]
        nearest = sorted(
            ((distance(gcj_lng, gcj_lat, p["lng"], p["lat"]), p) for p in points
             if p.get("lng") is not None and p.get("lat") is not None),
            key=lambda item: item[0],
        )[:3]
        results.append({
            "file": path.name,
            "point_id": point_id,
            "point_name": point["name"],
            "exif_bytes": len(im.info.get("exif", b"")),
            "camera": [str(exif.get(271, "")), str(exif.get(272, ""))],
            "gps_date": str(gps.get(29, "")),
            "gps_processing_method": str(gps.get(27, "")),
            "gps_datum": str(gps.get(18, "not recorded; WGS-84 assumed")),
            "gps_horizontal_error": str(gps.get(31, "not recorded")),
            "wgs84": {"lng": round(lng, 8), "lat": round(lat, 8)},
            "gcj02": {"lng": round(gcj_lng, 8), "lat": round(gcj_lat, 8)},
            "point_gcj02": {"lng": point["lng"], "lat": point["lat"]},
            "distance_m": round(distance(gcj_lng, gcj_lat, point["lng"], point["lat"]), 1),
            "nearest_points": [
                {"id": p["id"], "name": p["name"], "distance_m": round(d, 1)}
                for d, p in nearest
            ],
        })
print(json.dumps(results, ensure_ascii=False, indent=2))

#!/usr/bin/env python3
"""Draw numbered callout circles on manual screenshots."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "-q"])
    from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "thesis-screenshots"
OUT = ROOT / "docs" / "thesis-screenshots" / "manual"

# (x%, y%, number) — relative to image size
MARKERS: dict[str, list[tuple[float, float, str]]] = {
    "01-homepage.png": [
        (0.78, 0.52, "1"),  # ดูทั้งหมด
        (0.35, 0.72, "2"),  # การ์ดสถานที่
    ],
    "02-places-list.png": [
        (0.12, 0.38, "1"),  # sidebar หมวด
        (0.72, 0.22, "2"),  # ช่องค้นหา
        (0.55, 0.55, "3"),  # การ์ด
    ],
    "03-places-filtered.png": [
        (0.12, 0.32, "1"),  # หมวดที่เลือก
    ],
    "04-place-detail.png": [
        (0.50, 0.35, "1"),  # รูปหลัก
        (0.88, 0.12, "2"),  # Google Maps
        (0.75, 0.55, "3"),  # ข้อมูลสำคัญ
    ],
    "06-login-member.png": [
        (0.50, 0.42, "1"),  # อีเมล
        (0.50, 0.52, "2"),  # รหัสผ่าน
        (0.50, 0.62, "3"),  # ปุ่มเข้าสู่ระบบ
    ],
    "07-register.png": [
        (0.50, 0.38, "1"),
        (0.50, 0.48, "2"),
        (0.50, 0.62, "3"),  # สมัคร
    ],
    "08-profile.png": [
        (0.55, 0.35, "1"),  # ชื่อ
        (0.55, 0.45, "2"),  # อีเมล
        (0.55, 0.72, "3"),  # บันทึก
    ],
    "09-assistant-chat.png": [
        (0.12, 0.22, "1"),  # แชทใหม่
        (0.55, 0.75, "2"),  # ช่องพิมพ์
        (0.88, 0.78, "3"),  # ส่ง
    ],
    "09b-assistant-with-reply.png": [
        (0.12, 0.30, "1"),  # ประวัติแชท
        (0.55, 0.45, "2"),  # คำตอบ
    ],
    "10-admin-login.png": [
        (0.50, 0.42, "1"),
        (0.50, 0.52, "2"),
        (0.50, 0.62, "3"),
    ],
    "11-admin-places.png": [
        (0.28, 0.17, "1"),  # แท็บเพิ่มสถานที่
        (0.50, 0.255, "2"),  # ช่องค้นหา
        (0.905, 0.365, "3"),  # แก้ไข
        (0.955, 0.365, "4"),  # ลบ
    ],
    "12-admin-place-new.png": [
        (0.35, 0.25, "1"),  # ชื่อสถานที่
        (0.35, 0.55, "2"),  # อัปโหลดรูป
        (0.85, 0.92, "3"),  # บันทึก
    ],
    "14-admin-categories.png": [
        (0.42, 0.305, "1"),  # ช่องชื่อหมวดใหม่
        (0.42, 0.385, "2"),  # ปุ่มเพิ่ม
        (0.68, 0.52, "3"),  # แก้ไข
        (0.78, 0.52, "4"),  # ลบ
    ],
    "15-admin-knowledge-foods.png": [
        (0.15, 0.17, "1"),  # แท็บ
        (0.50, 0.32, "2"),  # ฟอร์ม
        (0.75, 0.55, "3"),  # รายการ
    ],
}


def load_font(size: int):
    for name in ("arialbd.ttf", "Arial Bold.ttf", "segoeui.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def annotate_file(name: str) -> Path | None:
    src = SRC / name
    if not src.exists():
        print(f"Skip missing: {name}")
        return None
    markers = MARKERS.get(name)
    if not markers:
        return None

    img = Image.open(src).convert("RGBA")
    w, h = img.size
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    r = max(16, int(min(w, h) * 0.018))
    font = load_font(max(14, int(r * 0.95)))

    for xp, yp, num in markers:
        x, y = int(w * xp), int(h * yp)
        bbox = [x - r, y - r, x + r, y + r]
        draw.ellipse(bbox, fill=(220, 38, 38, 230), outline=(255, 255, 255, 255), width=3)
        tw, th = draw.textbbox((0, 0), num, font=font)[2:]
        draw.text((x - tw / 2, y - th / 2 - 1), num, fill=(255, 255, 255, 255), font=font)

    out = OUT / name.replace(".png", "-annotated.png")
    OUT.mkdir(parents=True, exist_ok=True)
    Image.alpha_composite(img, overlay).convert("RGB").save(out, quality=92)
    print(f"  OK {out.name}")
    return out


def main():
    print("Annotating manual screenshots...")
    for name in MARKERS:
        annotate_file(name)
    print(f"Done -> {OUT}")


if __name__ == "__main__":
    main()

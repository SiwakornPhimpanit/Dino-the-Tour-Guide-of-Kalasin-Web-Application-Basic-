/**
 * ดาวน์โหลดแบนเนอร์คม 1920px (รันครั้งเดียวเมื่อต้องการอัปเดตไฟล์ local)
 * npm run hero:fetch
 */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "frontend/public/hero-banner.jpg");

/** ไดโนเสาร์หน้าพิพิธภัณฑ์สิรินธร กาฬสินธุ์ — Wikimedia CC BY-SA */
const SOURCE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Dinosaur_%40%E0%B8%9E%E0%B8%B4%E0%B8%9E%E0%B8%B4%E0%B8%98%E0%B8%A0%E0%B8%B1%E0%B8%93%E0%B8%91%E0%B9%8C%E0%B8%AA%E0%B8%B4%E0%B8%A3%E0%B8%B4%E0%B8%99%E0%B8%98%E0%B8%A3_%2CSirindhorn_Museum_%2CKalasin%2CThailand_-_panoramio.jpg/1920px-Dinosaur_%40%E0%B8%9E%E0%B8%B4%E0%B8%9E%E0%B8%B4%E0%B8%98%E0%B8%A0%E0%B8%B1%E0%B8%93%E0%B8%91%E0%B9%8C%E0%B8%AA%E0%B8%B4%E0%B8%A3%E0%B8%B4%E0%B8%99%E0%B8%98%E0%B8%A3_%2CSirindhorn_Museum_%2CKalasin%2CThailand_-_panoramio.jpg";

const res = await fetch(SOURCE, {
  headers: { "User-Agent": "KarasinTravelGuide/1.0 (local setup)" },
});

if (!res.ok) {
  console.error(`Download failed: ${res.status} ${res.statusText}`);
  console.error("Use HERO_BANNER_REMOTE in media.ts until rate limit clears.");
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(OUT, buf);
console.log(`Saved ${OUT} (${(buf.length / 1024).toFixed(0)} KB)`);

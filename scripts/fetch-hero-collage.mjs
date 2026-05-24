/**
 * ดาวน์โหลดรูปแบนเนอร์จาก Wikimedia (ทางเลือก)
 * แบนเนอร์ปัจจุบันใช้รูปใน frontend/public/hero/collage-1..4.png ที่ผู้ใช้เลือก
 * npm run hero:collage
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "frontend/public/hero");

/** แต่ละช่องใช้ไฟล์ Wikimedia คนละรูป */
const TILES = [
  {
    file: "collage-1.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%98%E0%B8%B2%E0%B8%95%E0%B8%B8%E0%B8%A2%E0%B8%B2%E0%B8%84%E0%B8%B9.JPG/960px-%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%98%E0%B8%B2%E0%B8%95%E0%B8%B8%E0%B8%A2%E0%B8%B2%E0%B8%84%E0%B8%B9.JPG",
  },
  {
    file: "collage-2.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Wat_Pho_Thong_%28Kam_Yai_Subdistrict%2C_Kalasin_Province%29.jpg/960px-Wat_Pho_Thong_%28Kam_Yai_Subdistrict%2C_Kalasin_Province%29.jpg",
  },
  {
    file: "collage-3.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Dinosaur_%40%E0%B8%9E%E0%B8%B4%E0%B8%9E%E0%B8%B4%E0%B8%98%E0%B8%A0%E0%B8%B1%E0%B8%93%E0%B8%91%E0%B9%8C%E0%B8%AA%E0%B8%B4%E0%B8%A3%E0%B8%B4%E0%B8%99%E0%B8%98%E0%B8%A3_%2CSirindhorn_Museum_%2CKalasin%2CThailand_-_panoramio.jpg/1920px-Dinosaur_%40%E0%B8%9E%E0%B8%B4%E0%B8%9E%E0%B8%B4%E0%B8%98%E0%B8%A0%E0%B8%B1%E0%B8%93%E0%B8%91%E0%B9%8C%E0%B8%AA%E0%B8%B4%E0%B8%A3%E0%B8%B4%E0%B8%99%E0%B8%98%E0%B8%A3_%2CSirindhorn_Museum_%2CKalasin%2CThailand_-_panoramio.jpg",
  },
  {
    file: "collage-4.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Phukao01_by_Nitikorn_Unpraderm.JPG/960px-Phukao01_by_Nitikorn_Unpraderm.JPG",
  },
];

mkdirSync(OUT_DIR, { recursive: true });

for (const tile of TILES) {
  const res = await fetch(tile.url, {
    headers: { "User-Agent": "KarasinTravelGuide/1.0 (collage setup)" },
  });
  if (!res.ok) {
    console.error(`FAIL ${tile.file}: ${res.status}`);
    process.exitCode = 1;
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(OUT_DIR, tile.file), buf);
  console.log(`OK ${tile.file} (${(buf.length / 1024).toFixed(0)} KB)`);
  await new Promise((r) => setTimeout(r, 5000));
}

console.log("Done -> frontend/public/hero/");

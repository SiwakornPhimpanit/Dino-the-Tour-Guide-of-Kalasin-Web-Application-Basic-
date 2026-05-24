/**
 * Capture thesis Chapter 4 screenshots (requires dev server on :5173 and API on :4000).
 * Usage: node scripts/capture-thesis-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "docs", "thesis-screenshots");
const BASE = "http://localhost:5173";
const API = "http://localhost:4000";
const VIEWPORT = { width: 1280, height: 800 };

const MEMBER = { email: "member.thesis@example.com", password: "thesis123", displayName: "สมาชิกทดสอบ" };
const ADMIN = { email: "admin@gmail.com", password: "1234" };

async function api(pathname, opts = {}) {
  const res = await fetch(`${API}${pathname}`, opts);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) throw new Error(`${pathname} ${res.status}: ${text.slice(0, 200)}`);
  return body;
}

async function ensureMember() {
  try {
    return await api("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(MEMBER),
    });
  } catch {
    return api("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: MEMBER.email, password: MEMBER.password }),
    });
  }
}

async function loginAdmin() {
  return api("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(ADMIN),
  });
}

async function setAuth(page, auth) {
  await page.evaluate((a) => {
    localStorage.setItem("karasin_user_auth", JSON.stringify(a));
  }, auth);
}

async function clearAuth(page) {
  await page.evaluate(() => localStorage.removeItem("karasin_user_auth"));
}

async function shot(page, filename, { fullPage = true, waitMs = 800 } = {}) {
  await page.waitForTimeout(waitMs);
  const file = path.join(OUT_DIR, filename);
  await page.screenshot({ path: file, fullPage });
  console.log(`  ✓ ${filename}`);
  return filename;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // Health check
  try {
    await fetch(`${API}/health`);
  } catch {
    console.error("API ไม่ตอบที่ http://localhost:4000 — รัน npm run dev ก่อน");
    process.exit(1);
  }

  const memberAuth = (await ensureMember()).data;
  const adminAuth = (await loginAdmin()).data;
  const placesRes = await api("/api/places");
  const places = placesRes.data ?? [];
  const firstPlaceId = places[0]?.id ?? 1;

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT, locale: "th-TH" });
  const page = await context.newPage();

  const manifest = [];

  console.log("\n📸 Public pages");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  manifest.push({ id: "01-home", file: await shot(page, "01-homepage.png") });

  await page.goto(`${BASE}/places`, { waitUntil: "networkidle" });
  manifest.push({ id: "02-places-all", file: await shot(page, "02-places-list.png") });

  await page.goto(`${BASE}/places?category_id=${places[0]?.categoryId ?? 1}`, { waitUntil: "networkidle" });
  manifest.push({ id: "03-places-filter", file: await shot(page, "03-places-filtered.png") });

  await page.goto(`${BASE}/places/${firstPlaceId}`, { waitUntil: "networkidle" });
  manifest.push({
    id: "04-place-detail",
    file: await shot(page, "04-place-detail.png", { waitMs: 1200 }),
    note: places[0]?.name ?? `place id ${firstPlaceId}`,
  });

  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  manifest.push({ id: "05-contact", file: await shot(page, "05-contact.png") });

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  manifest.push({ id: "06-login", file: await shot(page, "06-login-member.png") });

  await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  manifest.push({ id: "07-register", file: await shot(page, "07-register.png") });

  console.log("\n📸 Member pages");
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await setAuth(page, memberAuth);
  await page.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  manifest.push({ id: "08-profile", file: await shot(page, "08-profile.png") });

  await page.goto(`${BASE}/assistant`, { waitUntil: "networkidle" });
  manifest.push({ id: "09-assistant", file: await shot(page, "09-assistant-chat.png", { waitMs: 2000 }) });

  const input = page.locator("textarea").first();
  if (await input.isVisible().catch(() => false)) {
    await input.fill("แนะนำที่เที่ยวครอบครัวในกาฬสินธุ์ 1 วัน");
    const sendBtn = page.locator(".assistantSend");
    if (await sendBtn.isVisible().catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(8000);
      manifest.push({
        id: "09b-assistant-reply",
        file: await shot(page, "09b-assistant-with-reply.png", { waitMs: 500 }),
      });
    }
  }

  console.log("\n📸 Admin pages");
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await clearAuth(page);
  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  manifest.push({ id: "10-admin-login", file: await shot(page, "10-admin-login.png") });

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await setAuth(page, adminAuth);
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  manifest.push({ id: "11-admin-places", file: await shot(page, "11-admin-places.png", { waitMs: 1200 }) });

  await page.goto(`${BASE}/admin/new`, { waitUntil: "networkidle" });
  manifest.push({ id: "12-admin-new", file: await shot(page, "12-admin-place-new.png", { waitMs: 1000 }) });

  await page.goto(`${BASE}/admin/edit/${firstPlaceId}`, { waitUntil: "networkidle" });
  manifest.push({
    id: "13-admin-edit",
    file: await shot(page, "13-admin-place-edit.png", { waitMs: 1500 }),
  });

  await page.goto(`${BASE}/admin/categories`, { waitUntil: "networkidle" });
  manifest.push({ id: "14-admin-categories", file: await shot(page, "14-admin-categories.png") });

  await page.goto(`${BASE}/admin/knowledge`, { waitUntil: "networkidle" });
  manifest.push({ id: "15-admin-knowledge-foods", file: await shot(page, "15-admin-knowledge-foods.png", { waitMs: 1200 }) });

  await page.getByRole("button", { name: "โซนที่พัก" }).click().catch(() => {});
  await page.waitForTimeout(600);
  manifest.push({ id: "16-admin-knowledge-zones", file: await shot(page, "16-admin-knowledge-zones.png") });

  await browser.close();

  const meta = {
    capturedAt: new Date().toISOString(),
    baseUrl: BASE,
    memberEmail: MEMBER.email,
    adminEmail: ADMIN.email,
    samplePlaceId: firstPlaceId,
    samplePlaceName: places[0]?.name ?? null,
    files: manifest,
  };
  await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(meta, null, 2), "utf8");
  console.log(`\n✅ Saved ${manifest.length} screenshots to docs/thesis-screenshots/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// etl/scrape.mjs — robusto, sin loops, part desde URL de producto
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import slugify from 'slugify';
import pLimit from 'p-limit';

const BASE = 'https://www.obsoautomation.com';
const START = BASE + '/manufacturers/';
const OUTDIR = new URL('./out/', import.meta.url).pathname;
await fs.mkdir(OUTDIR, { recursive: true });

const MAX_PAGES = process.env.MAX_PAGES ? Number(process.env.MAX_PAGES) : 1; // 0 = todas
const CONCURRENCY = Number(process.env.CONCURRENCY || 2);
const POLITE_DELAY_MS = Number(process.env.POLITE_DELAY_MS) || 800;
const ONLY = (process.env.ONLY || '').toLowerCase();
const MAX_LAST = 2000; // tope de seguridad por si algo raro en paginación
const limit = pLimit(CONCURRENCY);

// ---------- utils ----------
function toSlug(name) {
  return slugify(name || '', { lower: true, strict: true });
}
function cleanSpaces(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}
function cleanBrandName(s) {
  return cleanSpaces(s).replace(/^\s*View All Products\s*$/i, '').replace(/View All Products/gi, '').trim();
}
function partFromProductUrl(href) {
  try {
    const u = new URL(href, BASE);
    // /product/<slug>/ => saco el último segmento no vacío
    const segs = u.pathname.split('/').filter(Boolean);
    const slug = segs[segs.length - 1] || '';
    return decodeURIComponent(slug); // dejamos hyphens tal cual
  } catch {
    return '';
  }
}
async function writeCsv(filePath, rows, headers) {
  const exists = await fs.access(filePath).then(()=>true).catch(()=>false);
  const header = headers.join(',') + '\n';
  const lines = rows.map(r =>
    headers.map(h => String(r[h] ?? '').replaceAll('"','""'))
           .map(s => `"${s}"`).join(',')
  ).join('\n') + '\n';
  if (!exists) await fs.writeFile(filePath, header, 'utf8');
  await fs.appendFile(filePath, lines, 'utf8');
}
async function waitAndDismissBanners(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(()=>{});
  // cookies/consent
  const patterns = [/accept/i, /agree/i, /ok/i, /aceptar/i];
  for (const re of patterns) {
    const btn = page.getByRole('button', { name: re });
    if (await btn.count().catch(()=>0)) {
      try { await btn.first().click({ timeout: 1200 }); } catch {}
    }
  }
  await page.waitForTimeout(300);
}

// ---------- manufacturers ----------
async function grabManufacturersOnPage(page) {
  const anchors = await page.$$eval('a[href*="/brand/"]', as =>
    as.map(a => {
      const href = a.href || '';
      const tile = a.closest('article, .brand, .brand-card, .card, li, .grid-item, .c-card');
      let name = '';
      if (tile) {
        const h = tile.querySelector('h1,h2,h3,strong,.brand-name,[class*="title"]');
        if (h) name = (h.textContent || '').trim();
      }
      if (!name) name = (a.textContent || '').trim();
      return { href, name };
    })
  ).catch(()=>[]);

  const map = new Map();
  for (const a of anchors) {
    if (!a.href) continue;
    const u = new URL(a.href);
    if (!u.pathname.startsWith('/brand/')) continue;
    const slug = u.pathname.split('/').filter(Boolean)[1] || '';
    if (!slug) continue;
    let name = cleanBrandName(a.name);
    if (!name) name = slug.replace(/-/g, ' ').toUpperCase();
    if (!map.has(slug)) map.set(slug, { slug, name, url: `${BASE}/brand/${slug}/` });
  }

  if (map.size === 0) {
    const tiles = await page.$$eval('h2, h3, .brand, .brand-title',
      els => els.map(e => (e.textContent||'').trim()).filter(Boolean)).catch(()=>[]);
    tiles.forEach(t => map.set(toSlug(t), { slug: toSlug(t), name: cleanBrandName(t), url: `${BASE}/brand/${toSlug(t)}/` }));
  }
  return Array.from(map.values());
}

async function getManufacturers(context) {
  const page = await context.newPage();
  await page.goto(START, { waitUntil: 'domcontentloaded' });
  await waitAndDismissBanners(page);

  let list = await grabManufacturersOnPage(page);
  if (list.length > 0) { await page.close(); return list; }

  // fallback por letras
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const bag = new Map();
  for (const L of letters) {
    await page.goto(`${START}?character=${L}`, { waitUntil: 'domcontentloaded' });
    await waitAndDismissBanners(page);
    const chunk = await grabManufacturersOnPage(page);
    chunk.forEach(m => bag.set(m.slug, m));
    if (chunk.length) await page.waitForTimeout(200);
  }
  if (bag.size === 0) {
    await page.screenshot({ path: path.join(OUTDIR, 'manufacturers-page.png'), fullPage: true });
  }
  await page.close();
  return Array.from(bag.values());
}

// ---------- pagination ----------
async function getLastPage(page) {
  // Sólo hrefs con ?page=#
  const nums = await page.$$eval('a[href*="?page="]', as =>
    as.map(a => {
      const m = a.href.match(/[?&]page=(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
  ).catch(()=>[]);
  const max = Math.max(1, ...nums);
  return Math.min(max, MAX_LAST);
}

// ---------- brand -> products ----------
async function scrapeBrand(context, brand) {
  const page = await context.newPage();
  const outProducts = path.join(OUTDIR, 'products.csv');
  const outManufacturers = path.join(OUTDIR, 'manufacturers.csv');

  // guarda manufacturer (idempotente)
  await writeCsv(outManufacturers, [{ slug: brand.slug, name: brand.name, source_url: brand.url }],
                 ['slug','name','source_url']);

  await page.goto(brand.url, { waitUntil: 'domcontentloaded' });
  await waitAndDismissBanners(page);

  const last = MAX_PAGES === 0 ? await getLastPage(page)
                               : Math.min(MAX_PAGES, await getLastPage(page));

  console.log(`[${brand.slug}] pages=${last}`);
  const seenHrefs = new Set();

  for (let p = 1; p <= last; p++) {
    const url = p === 1 ? brand.url : `${brand.url}?page=${p}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await waitAndDismissBanners(page);

    // Tomamos UNA URL de producto por tarjeta y deducimos part del slug
    const cards = await page.$$eval('article, .product, li, .grid-item, .card, .c-card, .product-card', nodes => {
      const res = [];
      nodes.forEach(card => {
        const link = card.querySelector('a[href*="/product/"]');
        if (!link) return;
        const href = new URL(link.getAttribute('href'), location.origin).href;
        // título preferente
        const h = card.querySelector('h1,h2,h3,.product-title,[class*="title"]');
        const title = (h ? h.textContent : card.textContent || '').replace(/\s+/g, ' ').trim();
        res.push({ href, title, cardText: (card.textContent || '').replace(/\s+/g, ' ').trim() });
      });
      return res;
    }).catch(()=>[]);

    const unique = [];
    for (const c of cards) {
      if (!c.href || seenHrefs.has(c.href)) continue;
      seenHrefs.add(c.href);

      const part = partFromProductUrl(c.href);
      if (!part) continue; // sin part, descarta

      // title limpio sin el part repetido
      let title = cleanSpaces(c.title.replace(part, ''));
      if (!title) title = cleanSpaces(c.cardText.replace(part, ''));
      if (title.length > 160) title = title.slice(0, 160);

      unique.push({
        brand_slug: brand.slug,
        part_number: part,
        title,
        url: c.href,
        availability: '',
        category: '',
        series: '',
        raw: JSON.stringify({ snippet: c.cardText })
      });
    }

    if (unique.length) {
      await writeCsv(outProducts, unique,
        ['brand_slug','part_number','title','url','availability','category','series','raw']);
      console.log(`  [${brand.slug}] page ${p}/${last} → +${unique.length} items`);
    } else {
      console.log(`  [${brand.slug}] page ${p}/${last} → 0 items`);
    }

    await page.waitForTimeout(POLITE_DELAY_MS);
  }
  await page.close();
}

// ---------- main ----------
(async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 }
  });

  let manufacturers = await getManufacturers(context);
  // guarda JSON para reutilizar
  await fs.writeFile(path.join(OUTDIR, 'manufacturers.json'), JSON.stringify(manufacturers, null, 2));
  console.log(`Found ${manufacturers.length} manufacturers.`);

  if (ONLY) {
    manufacturers = manufacturers.filter(m => m.slug === ONLY || toSlug(m.name) === ONLY);
    console.log(`Filtering by ONLY=${ONLY} → ${manufacturers.length} manufacturer(s).`);
  }

  await Promise.all(manufacturers.map(m => limit(() => scrapeBrand(context, m))));

  await browser.close();
  console.log('Done. See out/manufacturers.csv and out/products.csv');
})().catch(e => { console.error(e); process.exit(1); });

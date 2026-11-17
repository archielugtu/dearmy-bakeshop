/**
 * Menu and opening hours from the bakery's Google Sheet.
 *
 * The Sheet's Apps Script (google-sheet/Code.gs) is deployed as a web app that
 * returns the Bakes and Hours tabs as JSON. This module fetches it once per build.
 *
 *   SHEET_API_URL  the web app's /exec URL
 *   SHEET_API_KEY  the key stored in the script's API_KEY property
 *
 * Neither set: the sample `bakes` and `hours` in site.ts are used, so the site
 * still builds locally and before the Sheet exists.
 * Set but the Sheet can't be read, or it has no usable bakes: the build fails
 * on purpose, so the host keeps serving the last good version of the site.
 */
import {
  bakes as sampleBakes,
  hours as sampleHours,
  blank,
  categories,
  type Bake,
  type CategoryId,
  type Photo,
} from './site';

type SheetBake = {
  row?: number;
  name?: string;
  category?: string;
  price?: string | number;
  description?: string;
  dearTo?: string;
  photo?: string;
  alt?: string;
};

type SheetHoursRow = { days?: string; time?: string };

type SheetResponse = {
  ok: boolean;
  error?: string;
  bakes?: SheetBake[];
  hours?: SheetHoursRow[];
  problems?: string[];
};

type Hours = { isPlaceholder: boolean; rows: { days: string; time: string }[] };

/** Shown in place of a missing or broken photo. */
const placeholderPhoto: Photo = { src: '/logo-384.webp', alt: '' };

const log = (msg: string) => console.log(`[sheet] ${msg}`);
const warn = (msg: string) => console.warn(`[sheet] ${msg}`);

const text = (v: unknown) => (v == null ? '' : String(v).trim());

/** Accepts "5.5", "$5.50", "NZ$ 5.50" or a number. */
export function parsePrice(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(text(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** Accepts a category id ("pastry") or its label ("Pastries"), any case. */
export function parseCategory(v: unknown): CategoryId | null {
  const s = text(v).toLowerCase();
  const match = categories.find((c) => c.id === s || c.label.toLowerCase() === s);
  return match ? match.id : null;
}

export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'bake'
  );
}

/** Turns Sheet rows into bakes. Invalid rows are skipped with a warning, never thrown. */
export function toBakes(rows: SheetBake[]): Bake[] {
  const seen = new Map<string, number>();
  const out: Bake[] = [];

  for (const [i, r] of rows.entries()) {
    const where = `Bakes row ${r.row ?? i + 2}`;
    const name = text(r.name);
    const category = parseCategory(r.category);
    const price = parsePrice(r.price);
    const description = text(r.description);

    const problems = [
      !name && 'no name',
      !category && `unknown type "${text(r.category)}"`,
      price === null && `price "${text(r.price)}" is not a number`,
      !description && 'no description',
    ].filter(Boolean);
    if (problems.length) {
      warn(`${where} skipped: ${problems.join(', ')}.`);
      continue;
    }

    const base = slugify(name);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);

    const url = text(r.photo);
    out.push({
      id: count > 1 ? `${base}-${count}` : base,
      name,
      category: category!,
      price: price!,
      description,
      dearTo: text(r.dearTo) || blank.fallback,
      photo: url ? { url, alt: text(r.alt) || name } : placeholderPhoto,
    });
  }
  return out;
}

/**
 * Confirms each remote photo really is an image anyone can load (a Drive file that
 * isn't shared returns a sign-in page). Broken ones fall back to the placeholder so
 * one bad link never stops the rest of the menu from updating.
 */
async function checkPhotos(list: Bake[]) {
  await Promise.all(
    list.map(async (b) => {
      const url = b.photo.url;
      if (!url) return;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
        const type = res.headers.get('content-type') ?? '';
        await res.body?.cancel();
        if (!res.ok || !type.startsWith('image/')) throw new Error(`got ${res.status} ${type || 'no content type'}`);
      } catch (err) {
        warn(`Photo for "${b.name}" can't be loaded (${(err as Error).message}). Using the placeholder.`);
        b.photo = placeholderPhoto;
      }
    }),
  );
}

async function fetchSheet(apiUrl: string, apiKey: string): Promise<SheetResponse> {
  const url = new URL(apiUrl);
  url.searchParams.set('key', apiKey);

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(60_000), redirect: 'follow' });
  } catch (err) {
    throw new Error(`[sheet] Could not reach the Sheet web app: ${(err as Error).message}`);
  }
  const body = await res.text();
  let data: SheetResponse;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error(
      `[sheet] The Sheet web app did not return JSON (HTTP ${res.status}). ` +
        'Check SHEET_API_URL is the /exec URL and the deployment is shared with "Anyone".',
    );
  }
  if (!data.ok) throw new Error(`[sheet] The Sheet web app refused the request: ${data.error ?? 'unknown error'}`);
  return data;
}

async function loadContent(): Promise<{ fromSheet: boolean; bakes: Bake[]; hours: Hours }> {
  const apiUrl = import.meta.env.SHEET_API_URL ?? process.env.SHEET_API_URL;
  const apiKey = import.meta.env.SHEET_API_KEY ?? process.env.SHEET_API_KEY;

  if (!apiUrl) {
    log('SHEET_API_URL not set. Using the sample menu and hours from site.ts.');
    return { fromSheet: false, bakes: sampleBakes, hours: sampleHours };
  }
  if (!apiKey) throw new Error('[sheet] SHEET_API_URL is set but SHEET_API_KEY is missing.');

  const data = await fetchSheet(apiUrl, apiKey);
  for (const p of data.problems ?? []) warn(p);

  const bakes = toBakes(data.bakes ?? []);
  if (!bakes.length) throw new Error('[sheet] The Bakes tab has no bakes ready for the website. Keeping the old site.');
  await checkPhotos(bakes);

  const rows = (data.hours ?? [])
    .map((r) => ({ days: text(r.days), time: text(r.time) }))
    .filter((r) => r.days && r.time);
  const hours: Hours = rows.length ? { isPlaceholder: false, rows } : sampleHours;
  if (!rows.length) warn('The Hours tab is empty. Using the sample hours.');

  log(`Loaded ${bakes.length} bakes and ${rows.length} hours rows.`);
  return { fromSheet: true, bakes, hours };
}

const content = await loadContent();

/** True when the menu came from the Sheet, so the "sample menu" note can be hidden. */
export const menuFromSheet = content.fromSheet;
export const bakes = content.bakes;
export const hours = content.hours;

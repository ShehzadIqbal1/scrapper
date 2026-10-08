const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (v, max = 500) => {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s ? s.slice(0, max) : undefined;
};
const num = (v) => {
  if (v == null || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Cleans one record from the extension.
 * Empty values are dropped so an upsert never wipes existing data in MongoDB.
 * Returns null when the record is unusable.
 */
export function sanitizePlace(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const name = str(raw.name, 300);
  const placeId = str(raw.placeId, 200);
  const ftid = str(raw.ftid, 100);
  const url = str(raw.url, 2000);
  const key = str(raw.key, 300) || placeId || ftid || (url ? url.split('?')[0] : undefined);
  if (!name || !key) return null;

  const emails = [
    ...new Set(
      [...(Array.isArray(raw.emails) ? raw.emails : []), raw.email]
        .filter(Boolean)
        .map((e) => String(e).trim().toLowerCase())
        .filter((e) => e.length <= 254 && EMAIL_RE.test(e))
    )
  ].slice(0, 10);

  let rating = num(raw.rating);
  if (rating != null && (rating < 0 || rating > 5)) rating = undefined;
  let reviews = num(raw.reviews);
  if (reviews != null) reviews = reviews >= 0 ? Math.round(reviews) : undefined;

  const lat = num(raw.lat);
  const lng = num(raw.lng);
  const validGeo = lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  const searchLocation = str(raw.location != null ? raw.location : raw.searchLocation, 200);
  const query = str(raw.query, 200);

  let scrapedAt;
  if (raw.scrapedAt) {
    const d = new Date(raw.scrapedAt);
    if (!isNaN(d)) scrapedAt = d;
  }

  const set = {
    name,
    category: str(raw.category, 120),
    rating,
    reviews,
    address: str(raw.address, 400),
    phone: str(raw.phone, 60),
    website: str(raw.website, 1000),
    email: emails[0],
    plusCode: str(raw.plusCode, 100),
    hours: str(raw.hours, 300),
    hoursTable: Array.isArray(raw.hoursTable)
      ? raw.hoursTable.map((h) => str(h, 200)).filter(Boolean).slice(0, 7)
      : undefined,
    lat: validGeo ? lat : undefined,
    lng: validGeo ? lng : undefined,
    geo: validGeo ? { type: 'Point', coordinates: [lng, lat] } : undefined,
    placeId,
    ftid,
    url,
    query,
    searchLocation,
    scrapedAt,
    status: 'pending'
  };
  if (set.hoursTable && !set.hoursTable.length) delete set.hoursTable;
  Object.keys(set).forEach((k) => set[k] === undefined && delete set[k]);

  const searchTag = query || searchLocation ? `${query || ''} | ${searchLocation || ''}`.trim() : undefined;
  return { key, set, emails, searchTag };
}

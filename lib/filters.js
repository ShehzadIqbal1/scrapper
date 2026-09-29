const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Builds a Mongo filter from URLSearchParams (shared by list + CSV export)
export function buildFilter(sp) {
  const f = {};
  const q = sp.get('q');
  if (q) {
    const re = new RegExp(escapeRe(q), 'i');
    f.$or = [{ name: re }, { address: re }, { phone: re }, { email: re }];
  }
  if (sp.get('category')) f.category = new RegExp(escapeRe(sp.get('category')), 'i');
  if (sp.get('city')) f.address = new RegExp(escapeRe(sp.get('city')), 'i');
  if (sp.get('search')) f.searches = new RegExp(escapeRe(sp.get('search')), 'i');
  if (sp.get('hasEmail') === 'true') f.email = { $exists: true, $ne: '' };
  if (sp.get('hasPhone') === 'true') f.phone = { $exists: true, $ne: '' };
  if (sp.get('hasWebsite') === 'true') f.website = { $exists: true, $ne: '' };
  const min = parseFloat(sp.get('minRating'));
  if (Number.isFinite(min)) f.rating = { $gte: min };

  // Date filter for scraped date
  const scrapedDate = sp.get('scrapedDate');
  if (scrapedDate) {
    const date = new Date(scrapedDate);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    f.scrapedAt = { $gte: startOfDay, $lte: endOfDay };
  }

  return f;
}

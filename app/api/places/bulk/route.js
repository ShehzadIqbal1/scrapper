import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import Place from '@/models/Place';
import { sanitizePlace } from '@/lib/sanitize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The extension calls this from a chrome-extension:// origin -> allow CORS
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
};
const json = (body, status = 200) => NextResponse.json(body, { status, headers: CORS });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function authorized(req) {
  const expected = process.env.API_KEY;
  if (!expected) return true;
  const given = Buffer.from(req.headers.get('x-api-key') || '');
  const want = Buffer.from(expected);
  return given.length === want.length && crypto.timingSafeEqual(given, want);
}

// POST /api/places/bulk   body: { "places": [ ... ] }  (max 500)
export async function POST(req) {
  if (!authorized(req)) return json({ ok: false, error: 'Invalid or missing x-api-key' }, 401);

  let body;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'Invalid JSON' }, 400); }

  const list = Array.isArray(body) ? body : body && body.places;
  if (!Array.isArray(list) || !list.length) {
    return json({ ok: false, error: 'Body must be { "places": [ ... ] }' }, 400);
  }
  if (list.length > 500) return json({ ok: false, error: 'Max 500 places per request' }, 400);

  // sanitize + de-duplicate inside the batch (last wins)
  const byKey = new Map();
  let invalid = 0;
  for (const raw of list) {
    const c = sanitizePlace(raw);
    if (!c) { invalid++; continue; }
    byKey.set(c.key, c);
  }
  if (!byKey.size) return json({ ok: false, error: 'No valid places in payload', invalid }, 400);

  const ops = [];
  for (const { key, set, emails, searchTag } of byKey.values()) {
    const update = { $set: set, $setOnInsert: { status: 'pending' } };
    const addToSet = {};
    if (emails.length) addToSet.emails = { $each: emails };
    if (searchTag) addToSet.searches = searchTag;
    if (Object.keys(addToSet).length) update.$addToSet = addToSet;
    ops.push({ updateOne: { filter: { key }, update, upsert: true } });
  }

  try {
    await connectDB();
    const r = await Place.bulkWrite(ops, { ordered: false });
    return json({
      ok: true,
      received: list.length,
      valid: byKey.size,
      invalid,
      inserted: r.upsertedCount,
      updated: r.matchedCount
    });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: e.message }, 500);
  }
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Place from '@/models/Place';
import { buildFilter } from '@/lib/filters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COLS = ['name', 'category', 'rating', 'reviews', 'address', 'phone', 'website', 'email', 'emails',
  'plusCode', 'hours', 'lat', 'lng', 'placeId', 'query', 'searchLocation', 'url', 'scrapedAt', 'createdAt'];

const cell = (v) => {
  if (Array.isArray(v)) v = v.join('; ');
  if (v instanceof Date) v = v.toISOString();
  if (v == null) v = '';
  v = String(v);
  return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
};

// GET /api/places/export?<same filters as list>&exportMode=new|previous|all  -> streams a CSV
export async function GET(req) {
  try {
    await connectDB();
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
  const sp = new URL(req.url).searchParams;
  const filter = buildFilter(sp);
  const enc = new TextEncoder();

  // Add sort order from query params (same as list view)
  const sortable = ['createdAt', 'updatedAt', 'scrapedAt', 'name', 'rating', 'reviews'];
  const sortField = sortable.includes(sp.get('sort')) ? sp.get('sort') : 'scrapedAt';
  const sortDir = sp.get('order') === 'asc' ? 1 : -1;

  // Export mode: new (not exported), previous (exported), or all
  const exportMode = sp.get('exportMode') || 'all';
  if (exportMode === 'new') {
    filter.exportedAt = { $exists: false };
  } else if (exportMode === 'previous') {
    filter.exportedAt = { $exists: true };
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(enc.encode('\ufeff' + COLS.join(',') + '\n'));
        const cursor = Place.find(filter).sort({ [sortField]: sortDir, _id: 1 }).lean().cursor();
        const exportedIds = [];

        for await (const doc of cursor) {
          controller.enqueue(enc.encode(COLS.map((c) => cell(doc[c])).join(',') + '\n'));
          exportedIds.push(doc._id);
        }

        // Mark exported records if in 'new' mode
        if (exportMode === 'new' && exportedIds.length > 0) {
          await Place.updateMany(
            { _id: { $in: exportedIds } },
            { $set: { exportedAt: new Date() } }
          );
        }

        controller.close();
      } catch (e) {
        controller.error(e);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="places.csv"'
    }
  });
}

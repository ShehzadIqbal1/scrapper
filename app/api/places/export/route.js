import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Place from '@/models/Place';
import { buildFilter } from '@/lib/filters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COLS = ['name', 'category', 'rating', 'reviews', 'address', 'phone', 'website', 'email', 'emails',
  'plusCode', 'hours', 'lat', 'lng', 'placeId', 'query', 'searchLocation', 'url', 'createdAt'];

const cell = (v) => {
  if (Array.isArray(v)) v = v.join('; ');
  if (v instanceof Date) v = v.toISOString();
  if (v == null) v = '';
  v = String(v);
  return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
};

// GET /api/places/export?<same filters as list>  -> streams a CSV
export async function GET(req) {
  try {
    await connectDB();
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
  const filter = buildFilter(new URL(req.url).searchParams);
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(enc.encode('\ufeff' + COLS.join(',') + '\n'));
        const cursor = Place.find(filter).sort({ createdAt: -1 }).lean().cursor();
        for await (const doc of cursor) {
          controller.enqueue(enc.encode(COLS.map((c) => cell(doc[c])).join(',') + '\n'));
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

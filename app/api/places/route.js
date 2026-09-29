import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Place from '@/models/Place';
import { buildFilter } from '@/lib/filters';

export const dynamic = 'force-dynamic';

// GET /api/places?page=1&limit=50&q=&category=&city=&hasEmail=true&sort=createdAt&order=desc
export async function GET(req) {
  try {
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const page = Math.max(1, parseInt(sp.get('page'), 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(sp.get('limit'), 10) || 50));
    const sortable = ['createdAt', 'updatedAt', 'scrapedAt', 'name', 'rating', 'reviews'];
    const sortField = sortable.includes(sp.get('sort')) ? sp.get('sort') : 'scrapedAt';
    const sortDir = sp.get('order') === 'asc' ? 1 : -1;

    const filter = buildFilter(sp);
    const [items, total] = await Promise.all([
      Place.find(filter).sort({ [sortField]: sortDir, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Place.countDocuments(filter)
    ]);
    return NextResponse.json({
      ok: true,
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      items: JSON.parse(JSON.stringify(items)) // ObjectId/Date -> strings
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

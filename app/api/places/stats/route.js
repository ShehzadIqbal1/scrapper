import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Place from '@/models/Place';
import { buildFilter } from '@/lib/filters';

export const dynamic = 'force-dynamic';

const has = (f) => ({ $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: [f, ''] } }, 0] }, 1, 0] } });

export async function GET(req) {
  try {
    await connectDB();
    const filter = buildFilter(new URL(req.url).searchParams);

    const [totals] = await Place.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withEmail: has('$email'),
          withPhone: has('$phone'),
          withWebsite: has('$website'),
          newExport: { $sum: { $cond: [{ $eq: ['$exportedAt', null] }, 1, 0] } },
          previousExport: { $sum: { $cond: [{ $ne: ['$exportedAt', null] }, 1, 0] } }
        }
      }
    ]);

    const topCategories = await Place.aggregate([
      { $match: { ...filter, category: { $exists: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 }
    ]);

    return NextResponse.json({
      ok: true,
      total: totals?.total || 0,
      withEmail: totals?.withEmail || 0,
      withPhone: totals?.withPhone || 0,
      withWebsite: totals?.withWebsite || 0,
      topCategories: topCategories.map((c) => ({ category: c._id, count: c.count })),
      exportStats: {
        new: totals?.newExport || 0,
        previous: totals?.previousExport || 0,
        all: totals?.total || 0
      }
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

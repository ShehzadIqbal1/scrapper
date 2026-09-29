import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Place from '@/models/Place';

export const dynamic = 'force-dynamic';

const has = (f) => ({ $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: [f, ''] } }, 0] }, 1, 0] } });

export async function GET() {
  try {
    await connectDB();
    const [totals] = await Place.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withEmail: has('$email'),
          withPhone: has('$phone'),
          withWebsite: has('$website')
        }
      }
    ]);
    const topCategories = await Place.aggregate([
      { $match: { category: { $exists: true } } },
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
      topCategories: topCategories.map((c) => ({ category: c._id, count: c.count }))
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

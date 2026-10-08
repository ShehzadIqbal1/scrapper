import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Place from '@/models/Place';
import { buildFilter, extractState, getStateName } from '@/lib/filters';

export const dynamic = 'force-dynamic';

const has = (f) => ({ $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: [f, ''] } }, 0] }, 1, 0] } });

// US State abbreviations
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP'
];

export async function GET(req) {
  try {
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const filter = buildFilter(sp);

    // Filter without status and state so all tabs display their counts dynamically
    const baseSp = new URLSearchParams(sp);
    baseSp.delete('status');
    baseSp.delete('state');
    const baseFilter = buildFilter(baseSp);

    // For state counts, we want to show all states regardless of current state filter
    const stateSp = new URLSearchParams(sp);
    stateSp.delete('state');
    const stateFilter = buildFilter(stateSp);

    const [totalsArr, statusAgg, topCategories, stateCounts] = await Promise.all([
      Place.aggregate([
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
      ]),
      Place.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            all: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            reached: { $sum: { $cond: [{ $eq: ['$status', 'reached'] }, 1, 0] } },
            convince: { $sum: { $cond: [{ $eq: ['$status', 'convince'] }, 1, 0] } },
            signed: { $sum: { $cond: [{ $eq: ['$status', 'signed'] }, 1, 0] } },
            dead: { $sum: { $cond: [{ $eq: ['$status', 'dead'] }, 1, 0] } }
          }
        }
      ]),
      Place.aggregate([
        { $match: { ...filter, category: { $exists: true } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 }
      ]),
      // Extract states from addresses and count them
      Place.aggregate([
        { $match: { ...stateFilter, address: { $exists: true, $ne: '' } } },
        {
          $addFields: {
            state: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: US_STATES,
                    as: 'st',
                    cond: {
                      $regexMatch: {
                        input: { $toUpper: '$address' },
                        regex: { $concat: ['\\b', '$$st', '\\b'] },
                        options: 'i'
                      }
                    }
                  }
                },
                0
              ]
            }
          }
        },
        { $match: { state: { $exists: true, $ne: null } } },
        { $group: { _id: '$state', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const totals = totalsArr[0];
    const statusTotals = statusAgg[0] || { all: 0, pending: 0, reached: 0, convince: 0, signed: 0, dead: 0 };

    return NextResponse.json({
      ok: true,
      total: totals?.total || 0,
      withEmail: totals?.withEmail || 0,
      withPhone: totals?.withPhone || 0,
      withWebsite: totals?.withWebsite || 0,
      statusCounts: {
        all: statusTotals.all || 0,
        pending: statusTotals.pending || 0,
        reached: statusTotals.reached || 0,
        convince: statusTotals.convince || 0,
        signed: statusTotals.signed || 0,
        dead: statusTotals.dead || 0
      },
      topCategories: topCategories.map((c) => ({ category: c._id, count: c.count })),
      stateCounts: stateCounts.map((c) => ({ state: c._id, name: getStateName(c._id), count: c.count })),
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

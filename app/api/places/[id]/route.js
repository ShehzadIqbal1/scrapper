import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Place from '@/models/Place';

export const dynamic = 'force-dynamic';

const bad = (id) => !mongoose.isValidObjectId(id);

export async function GET(req, { params }) {
  try {
    if (bad(params.id)) return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
    await connectDB();
    const p = await Place.findById(params.id).lean();
    if (!p) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, item: JSON.parse(JSON.stringify(p)) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    if (bad(params.id)) return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
    await connectDB();
    const p = await Place.findByIdAndDelete(params.id);
    if (!p) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, deleted: String(p._id) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    if (bad(params.id)) return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
    await connectDB();
    const body = await req.json();
    const p = await Place.findByIdAndUpdate(params.id, { $set: body }, { new: true });
    if (!p) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, item: JSON.parse(JSON.stringify(p)) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

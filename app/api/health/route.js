import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ ok: true, db: 'connected' });
  } catch (e) {
    return NextResponse.json({ ok: false, db: 'error', error: e.message }, { status: 500 });
  }
}

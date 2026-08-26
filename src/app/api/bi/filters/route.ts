import { NextResponse } from 'next/server';
import { BACKEND_URL } from '../../../../lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const backendUrl = BACKEND_URL;
    const res = await fetch(`${backendUrl}/api/bi/filters`, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: 'Backend error' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

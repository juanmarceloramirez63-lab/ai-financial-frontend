import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '../../../../lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const backendUrl = BACKEND_URL;
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '50000';
    
    const res = await fetch(`${backendUrl}/api/bi/raw?limit=${limit}`, { 
      cache: 'no-store',
      headers: { 'User-Agent': 'NextJS-Proxy' }
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Backend error' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

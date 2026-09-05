import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '../../../../lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = BACKEND_URL;
    
    const res = await fetch(`${backendUrl}/api/bi/stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-Proxy'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: errorText || 'Backend error' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

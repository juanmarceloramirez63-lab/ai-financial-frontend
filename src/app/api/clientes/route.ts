import { NextResponse } from 'next/server';
import { BACKEND_URL } from '../../../lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

  try {
    const backendUrl = BACKEND_URL;
    const res = await fetch(`${backendUrl}/api/clientes`, { 
      cache: 'no-store',
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn("Backend returned non-ok status, returning empty clients array.");
      return NextResponse.json({ status: 'success', clientes: [] });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Timeout or exception fetching clientes, falling back to empty array:", error.name === 'AbortError' ? 'Timeout (3s)' : error.message);
    // Prevent UI freezing by returning a 200 with an empty list
    return NextResponse.json({ status: 'success', clientes: [] });
  }
}

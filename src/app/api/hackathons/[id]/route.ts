import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/hackathons/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching hackathon detail proxy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

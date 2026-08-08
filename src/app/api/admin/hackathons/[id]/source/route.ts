import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * GET /api/admin/hackathons/[id]/source
 * Admin-only proxy for the backend GET /admin/hackathons/:id/source endpoint.
 *
 * Returns the raw extraction source data (rawSourceText, imageUrl, extractionSource)
 * for a given hackathon listing. Used by the admin panel to review pending or flagged
 * submissions against their original source material.
 *
 * Access is gated by the server-side AdminGuard on the backend.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const res = await fetch(
      `${BACKEND_URL}/admin/hackathons/${id}/source`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in admin source proxy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

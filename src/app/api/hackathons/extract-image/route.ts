import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * POST /api/hackathons/extract-image
 * Proxy route for Path B (image/pasted-text) extraction.
 *
 * Forwards a multipart/form-data request (with optional 'image' file and optional
 * 'pastedText' field) to the backend /hackathons/extract-image endpoint.
 * The backend runs Gemini extraction and returns structured event data.
 *
 * Content-Type is intentionally NOT set — Next.js will preserve the incoming
 * multipart boundary from the client request.
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read the incoming FormData from the client request
    const formData = await req.formData();

    // Forward the FormData as-is to the backend
    // Do NOT set Content-Type — fetch will set it automatically with the correct multipart boundary
    const res = await fetch(`${BACKEND_URL}/hackathons/extract-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Note: Content-Type header is intentionally omitted so fetch sets the multipart boundary correctly
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in extract-image proxy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

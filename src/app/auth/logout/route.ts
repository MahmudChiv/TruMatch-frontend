import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete('trumatch_token');

  return NextResponse.redirect(new URL('/', request.url), 303);
}

import { redirect } from 'next/navigation';
import { getSessionToken } from '@/lib/auth';
import type { DashboardData } from '@/lib/api/types';
import DashboardShell from '@/components/dashboard/DashboardShell';

export const metadata = {
  title: 'Dashboard — TruMatch',
  description: 'Your commitment score, GitHub activity breakdown, and interview summary.',
};

async function getDashboardData(token: string): Promise<DashboardData | null> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${backendUrl}/users/me/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const token = await getSessionToken();
  if (!token) redirect('/');

  const data = await getDashboardData(token);
  if (!data || !data.user) redirect('/');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <DashboardShell initialData={data} />
    </div>
  );
}


import { redirect } from 'next/navigation';
import { getCurrentUser, getSessionToken } from '@/lib/auth';
import type { AdminQueueItem } from '@/lib/api/types';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Admin Moderation Queue — TruMatch',
  description: 'Manage pending and reported hackathon listings.',
};

async function checkAdminStatus(token: string): Promise<boolean> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${backendUrl}/admin/check`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function getAdminQueue(token: string): Promise<AdminQueueItem[]> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${backendUrl}/admin/hackathons`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function AdminPage() {
  const token = await getSessionToken();
  if (!token) redirect('/dashboard');

  const isAdmin = await checkAdminStatus(token);
  if (!isAdmin) redirect('/dashboard');

  const user = await getCurrentUser();
  if (!user) redirect('/dashboard');

  const queue = await getAdminQueue(token);

  return <AdminShell user={user} initialQueue={queue} />;
}

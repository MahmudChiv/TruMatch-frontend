import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import SettingsShell from '@/components/dashboard/SettingsShell';

export const metadata = {
  title: 'Settings — TruMatch',
  description: 'Manage your TruMatch profile and appearance preferences.',
};

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  return <SettingsShell initialUser={user} />;
}

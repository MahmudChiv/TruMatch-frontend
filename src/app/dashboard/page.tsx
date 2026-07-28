import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-24 w-full flex-grow flex flex-col justify-center">
        <div className="bg-[#111115]/80 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-24 h-24 rounded-full border-2 border-white/20 shadow-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold text-white/60">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {user.name || user.username}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Authenticated via GitHub
                </span>
              </div>

              <p className="text-sm text-neutral-400">@{user.username}</p>

              {user.bio && (
                <p className="text-sm text-neutral-300 italic pt-1">{user.bio}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="bg-neutral-900/60 p-4 rounded-xl border border-white/5 text-center">
              <span className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                Commitment Score
              </span>
              <span className="text-3xl font-extrabold text-white">
                {user.commitmentScore}
              </span>
            </div>

            <div className="bg-neutral-900/60 p-4 rounded-xl border border-white/5 text-center">
              <span className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                GitHub ID
              </span>
              <span className="text-lg font-mono text-neutral-300">
                {user.githubId}
              </span>
            </div>

            <div className="bg-neutral-900/60 p-4 rounded-xl border border-white/5 text-center">
              <span className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                Member Since
              </span>
              <span className="text-sm font-medium text-neutral-300">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
            <span className="text-xs text-neutral-500">
              Next step: AI Commitment Verification Interview
            </span>

            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-white/10 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

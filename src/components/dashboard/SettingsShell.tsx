'use client';

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/api/types';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface Props {
  initialUser: UserProfile;
}

const AVAILABLE_ROLE_TAGS = [
  'Backend',
  'Frontend',
  'Mobile',
  'AI/ML',
  'Design/UI',
  'Product/PM',
  'DevOps',
];

export default function SettingsShell({ initialUser }: Props) {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Profile form state
  const [bio, setBio] = useState(initialUser.bio || '');
  const [contextNote, setContextNote] = useState(initialUser.contextNote || '');
  const [roleTags, setRoleTags] = useState<string[]>(initialUser.roleTags || []);
  const [primaryStack, setPrimaryStack] = useState(initialUser.primaryStack || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  // Theme state ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('trumatch_theme') as 'dark' | 'light' | null;
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('trumatch_theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const toggleRoleTag = (tag: string) => {
    setRoleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const res = await fetch('/api/users/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: bio.trim() || null,
          contextNote: contextNote.trim() || null,
          roleTags,
          primaryStack: primaryStack.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.message || data.error || 'Failed to update profile');
        return;
      }

      setUser((prev) => ({
        ...prev,
        bio: bio.trim() || null,
        contextNote: contextNote.trim() || null,
        roleTags,
        primaryStack: primaryStack.trim() || null,
      }));

      setSaveMessage('Profile saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch {
      setSaveError('Unexpected error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const sidebarWidth = sidebarCollapsed ? '64px' : '240px';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <style>{`
        @media (max-width: 767px) {
          .settings-main-container { margin-left: 0 !important; }
          .settings-main-content { padding: 16px 16px 36px !important; }
        }
      `}</style>

      <DashboardSidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div
        className="settings-main-container"
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DashboardHeader
          user={user}
          title="Account Settings"
          subtitle="Manage your developer profile & appearance"
          onMobileMenuToggle={() => setMobileSidebarOpen(true)}
        />

        <main className="settings-main-content" style={{ flex: 1, padding: '24px 32px', maxWidth: '850px', width: '100%' }}>
          {/* ── 1. Profile Settings Card ── */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-mid)',
              borderRadius: '20px',
              padding: '28px',
              marginBottom: '24px',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Developer Profile
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Your roles, tech stack, bio, and transparency note visible to potential hackathon teammates.
              </p>
            </div>

            {saveMessage && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', fontSize: '0.82rem', marginBottom: '16px' }}>
                {saveMessage}
              </div>
            )}

            {saveError && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: '0.82rem', marginBottom: '16px' }}>
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              {/* Role Tags Multi-Select */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Role Tags (Select all that apply)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {AVAILABLE_ROLE_TAGS.map((tag) => {
                    const selected = roleTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleRoleTag(tag)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '99px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: selected
                            ? '1px solid rgba(167,139,250,0.5)'
                            : '1px solid var(--border-mid)',
                          background: selected
                            ? 'rgba(167,139,250,0.15)'
                            : 'var(--surface-raised)',
                          color: selected ? '#c4b5fd' : 'var(--text-secondary)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {selected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Stack */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Primary Tech Stack
                </label>
                <input
                  type="text"
                  value={primaryStack}
                  onChange={(e) => setPrimaryStack(e.target.value)}
                  placeholder="e.g. Node.js, TypeScript, NestJS, React, Python"
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Bio */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief self-description of your background and development interests..."
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Context Note */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Transparency Context Note
                </label>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  A public note shown near your commitment score on your public profile. Does NOT alter your score.
                </p>
                <textarea
                  rows={3}
                  value={contextNote}
                  onChange={(e) => setContextNote(e.target.value)}
                  placeholder="e.g. Most of my major work in 2025 was in private enterprise GitLab repositories..."
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    background: 'var(--text-primary)',
                    border: 'none',
                    color: 'var(--bg-primary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: isSaving ? 'wait' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* ── 2. Appearance & Theme Switcher Card ── */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-mid)',
              borderRadius: '20px',
              padding: '28px',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Appearance & Theme
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Customize your visual theme. Dark mode is default; Light mode provides a clean white theme.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Dark Theme Option */}
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  border: theme === 'dark' ? '2px solid #c084fc' : '1px solid var(--border-mid)',
                  background: '#0a0a0a',
                  color: '#f2f2f2',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>🌙 Dark Theme</span>
                  {theme === 'dark' && <span style={{ color: '#c084fc', fontWeight: 800, fontSize: '0.8rem' }}>Active</span>}
                </div>
                <p style={{ fontSize: '0.76rem', color: '#a0a0a0', margin: 0 }}>
                  Sleek dark background with vibrant glassmorphic highlights.
                </p>
              </button>

              {/* Light Theme Option */}
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  border: theme === 'light' ? '2px solid #2563eb' : '1px solid var(--border-mid)',
                  background: '#ffffff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>☀️ Light Theme</span>
                  {theme === 'light' && <span style={{ color: '#2563eb', fontWeight: 800, fontSize: '0.8rem' }}>Active</span>}
                </div>
                <p style={{ fontSize: '0.76rem', color: '#475569', margin: 0 }}>
                  Clean white background with Slate & Blue uniform tones.
                </p>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

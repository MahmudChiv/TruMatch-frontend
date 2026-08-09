'use client';

import Image from 'next/image';
import type { UserProfile } from '@/lib/api/types';

interface Props {
  user: UserProfile;
  title?: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
}

export default function DashboardHeader({ user, title, subtitle, onMobileMenuToggle }: Props) {
  const avatarInitials = (user.name || user.username).slice(0, 2).toUpperCase();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px',
      gap: '16px',
      flexWrap: 'wrap',
    }}>
      <style>{`
        @media (max-width: 767px) {
          .dash-mobile-hamburger { display: flex !important; }
        }
        @media (min-width: 768px) {
          .dash-mobile-hamburger { display: none !important; }
        }
      `}</style>
      
      {/* Title & subtitle + Mobile hamburger toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {onMobileMenuToggle && (
          <button
            className="dash-mobile-hamburger"
            onClick={onMobileMenuToggle}
            aria-label="Open navigation menu"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid var(--border-mid)',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        <div>
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            {title || 'Dashboard Overview'}
          </h1>
          <p style={{
            margin: '4px 0 0',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
          }}>
            {subtitle || 'Monitor commitment metrics, GitHub signals, and AI interview summary.'}
          </p>
        </div>
      </div>

      {/* User info widget */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--surface)',
        border: '1px solid var(--border-mid)',
        padding: '6px 14px 6px 8px',
        borderRadius: '99px',
      }}>
        {user.avatarUrl ? (
          <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
            <Image
              src={user.avatarUrl}
              alt={user.username}
              width={36}
              height={36}
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#34d399', border: '2px solid var(--surface)',
            }} />
          </div>
        ) : (
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #4f3a6b, #1e1b26)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 700, color: '#c4b5fd',
          }}>
            {avatarInitials}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {user.name || user.username}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 500, lineHeight: 1.2 }}>
            ● GitHub Verified
          </span>
        </div>
      </div>
    </header>
  );
}

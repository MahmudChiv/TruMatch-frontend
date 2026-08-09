'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { UserProfile } from '@/lib/api/types';

/* ── SVG Icon components ──────────────────────────────────────────────────── */

const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 1 0-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconSettingsGear = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconLogOut = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* ── Types & data ─────────────────────────────────────────────────────────── */

interface Props {
  user: UserProfile;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const DUR = '0.28s';

/* ── Component ────────────────────────────────────────────────────────────── */

export default function DashboardSidebar({ user: _user, collapsed, onToggle, mobileOpen = false, onMobileClose }: Props) {
  const pathname = usePathname();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <IconGrid />, href: '/dashboard' },
    { id: 'hackathons', label: 'Hackathons & Teams', icon: <IconUsers />, href: '/hackathons' },
    { id: 'ratings', label: 'Ratings', icon: <IconStar />, href: '#' },
    { id: 'settings', label: 'Settings', icon: <IconSettingsGear />, href: '/dashboard/settings' },
  ];

  if (_user.email && ['mahmud.adegboyega@gmail.com'].includes(_user.email.toLowerCase())) {
    navItems.push({ id: 'admin', label: 'Admin Queue', icon: <IconShield />, href: '/admin' });
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 140,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <style>{`
        @media (max-width: 767px) {
          .dash-sidebar {
            transform: ${mobileOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            width: 260px !important;
            z-index: 150 !important;
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
        }
      `}</style>

      <aside
        className="dash-sidebar"
        style={{
          position: 'fixed',
          left: 0, top: 0, bottom: 0,
          width: collapsed ? '64px' : '240px',
          transition: `width ${DUR} ${EASE}`,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border-mid)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          overflow: 'hidden',
        }}
        aria-label="Primary navigation"
      >
      {/* ── Logo / header row ── */}
      <div style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: '0 18px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {/* Logo link */}
        <a
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <Image
            src="/logo.svg"
            alt="TruMatch"
            width={28}
            height={28}
            priority
            style={{ flexShrink: 0, display: 'block' }}
          />
          {/* Wordmark — fades + collapses on sidebar close */}
          <span style={{
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '-0.01em',
            background: 'linear-gradient(135deg, #f0ece4 0%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            whiteSpace: 'nowrap',
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? '0px' : '160px',
            overflow: 'hidden',
            transition: `opacity 0.15s, max-width ${DUR} ${EASE}`,
          }}>
            TruMatch
          </span>
        </a>

        {/* X collapse button — hides when collapsed */}
        <button
          onClick={onToggle}
          id="sidebar-collapse-btn"
          aria-label="Collapse sidebar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            minWidth: '28px',
            maxWidth: collapsed ? '0px' : '28px',
            height: '28px',
            overflow: 'hidden',
            borderRadius: '7px',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            flexShrink: 0,
            opacity: collapsed ? 0 : 1,
            pointerEvents: collapsed ? 'none' : 'auto',
            transition: `max-width ${DUR} ${EASE}, opacity 0.15s`,
          }}
          onMouseEnter={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.color = 'var(--text-primary)';
            btn.style.borderColor = 'rgba(255,255,255,0.18)';
            btn.style.background = 'rgba(255,255,255,0.04)';
          }}
          onMouseLeave={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.color = 'var(--text-muted)';
            btn.style.borderColor = 'var(--border)';
            btn.style.background = 'transparent';
          }}
        >
          <IconX />
        </button>
      </div>

      {/* ── Expand button — only visible when collapsed ── */}
      <div style={{
        height: collapsed ? '44px' : '0px',
        overflow: 'hidden',
        transition: `height ${DUR} ${EASE}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <button
          onClick={onToggle}
          id="sidebar-expand-btn"
          aria-label="Expand sidebar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface-raised)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = 'rgba(167,139,250,0.1)';
            btn.style.color = '#a78bfa';
          }}
          onMouseLeave={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = 'var(--surface-raised)';
            btn.style.color = 'var(--text-secondary)';
          }}
        >
          <IconChevronRight />
        </button>
      </div>

      {/* ── Nav items ── */}
      <nav
        style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}
        aria-label="Sidebar navigation"
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && item.href !== '#' && pathname.startsWith(item.href));

          return (
            <a
              key={item.id}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '2px 8px',
                padding: '10px 12px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(167,139,250,0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(167,139,250,0.15)' : '1px solid transparent',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'background 0.15s, color 0.15s',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  const a = e.currentTarget as HTMLAnchorElement;
                  a.style.background = 'rgba(255,255,255,0.04)';
                  a.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  const a = e.currentTarget as HTMLAnchorElement;
                  a.style.background = 'transparent';
                  a.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {/* Icon */}
              <span
                style={{
                  color: isActive ? '#a78bfa' : 'inherit',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                }}
              >
                {item.icon}
              </span>

            {/* Label — animates out when collapsed */}
            <span style={{
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? '0px' : '180px',
              overflow: 'hidden',
              transition: `opacity 0.15s, max-width ${DUR} ${EASE}`,
              whiteSpace: 'nowrap',
            }}>
              {item.label}
            </span>
          </a>
        );
      })}
      </nav>

      {/* ── Bottom: divider + logout ── */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '8px' }}>
          <a
            id="sign-out-link"
            href="/api/auth/signout"
            title={collapsed ? 'Sign out' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '10px',
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 400,
              transition: 'background 0.15s, color 0.15s',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={e => {
              const a = e.currentTarget as HTMLAnchorElement;
              a.style.color = '#f87171';
              a.style.background = 'rgba(248,113,113,0.06)';
            }}
            onMouseLeave={e => {
              const a = e.currentTarget as HTMLAnchorElement;
              a.style.color = 'var(--text-secondary)';
              a.style.background = 'transparent';
            }}
          >
            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px' }}>
              <IconLogOut />
            </span>
            <span style={{
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? '0px' : '180px',
              overflow: 'hidden',
              transition: `opacity 0.15s, max-width ${DUR} ${EASE}`,
              whiteSpace: 'nowrap',
            }}>
              Sign out
            </span>
          </a>
          </div>
      </div>
    </aside>
    </>
  );
}

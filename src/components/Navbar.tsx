'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface NavItem { label: string; href: string; }

const NAV_ITEMS: NavItem[] = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features',     href: '#features' },
  { label: 'Scoring',      href: '#scoring' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        transition: 'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease',
        background: scrolled ? 'rgba(10, 10, 10, 0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(120%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
    >
      <nav
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 28px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          fontFamily: 'var(--font-edu-hand), cursive',
        }}
      >
        {/* ── Logo ── */}
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Image src="/logo.svg" alt="TruMatch logo" width={34} height={34} priority />
          <span
            style={{
              fontWeight: 700,
              fontSize: '1.2rem',
              letterSpacing: '-0.01em',
              background: 'linear-gradient(135deg, #f0ece4 0%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            TruMatch
          </span>
        </a>

        {/* ── Desktop nav links ── */}
        <ul style={{ display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none', marginLeft: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <li key={item.label}>
              <a
                href={item.href}
                style={{
                  color: 'rgba(240,236,228,0.6)',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  transition: 'color 0.2s, background 0.2s',
                  display: 'block',
                  fontFamily: 'var(--font-edu-hand), cursive',
                }}
                onMouseEnter={e => {
                  const a = e.currentTarget as HTMLAnchorElement;
                  a.style.color = '#f0ece4';
                  a.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={e => {
                  const a = e.currentTarget as HTMLAnchorElement;
                  a.style.color = 'rgba(240,236,228,0.6)';
                  a.style.background = 'transparent';
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* ── CTA buttons ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/github`}
            style={{
              color: 'rgba(240,236,228,0.65)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              padding: '8px 16px',
              transition: 'color 0.2s',
              fontFamily: 'var(--font-edu-hand), cursive',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#f0ece4')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(240,236,228,0.65)')}
          >
            Sign in
          </a>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/github`}
            style={{
              background: 'linear-gradient(135deg, #201927ff 0%, #272623ff 100%)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '9px 22px',
              borderRadius: '10px',
              transition: 'opacity 0.2s, transform 0.2s, box-shadow 0.2s',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-edu-hand), cursive',
            }}
            onMouseEnter={e => {
              const a = e.currentTarget as HTMLAnchorElement;
              a.style.opacity = '0.88';
              a.style.transform = 'translateY(-1px)';
              a.style.boxShadow = '0 8px 24px rgba(168,85,247,0.35)';
            }}
            onMouseLeave={e => {
              const a = e.currentTarget as HTMLAnchorElement;
              a.style.opacity = '1';
              a.style.transform = 'translateY(0)';
              a.style.boxShadow = 'none';
            }}
          >
            Get Started
          </a>
        </div>
      </nav>
    </header>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface NavItem { label: string; href: string; }

const NAV_ITEMS: NavItem[] = [
  { label: 'Hero',    href: '#hero' },
  { label: 'Why',     href: '#why-trumatch' },
  { label: 'Connect', href: '#connect' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      setMobileMenuOpen(false);
      const targetId = href.slice(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', href);
      }
    }
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        transition: 'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease',
        background: scrolled || mobileMenuOpen ? 'rgba(10, 10, 10, 0.95)' : 'transparent',
        backdropFilter: scrolled || mobileMenuOpen ? 'blur(20px) saturate(120%)' : 'none',
        borderBottom: scrolled || mobileMenuOpen ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
    >
      <style>{`
        @media (max-width: 767px) {
          .nav-desktop-items { display: none !important; }
          .nav-desktop-cta { display: none !important; }
          .nav-mobile-toggle { display: flex !important; }
        }
        @media (min-width: 768px) {
          .nav-mobile-toggle { display: none !important; }
          .nav-mobile-menu { display: none !important; }
        }
      `}</style>
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
          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
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
        <ul className="nav-desktop-items" style={{ display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none', marginLeft: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <li key={item.label}>
              <a
                href={item.href}
                onClick={e => handleNavClick(e, item.href)}
                style={{
                  color: 'rgba(240,236,228,0.6)',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  transition: 'color 0.2s, background 0.2s',
                  display: 'block',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
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
        <div className="nav-desktop-cta" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/github`}
            style={{
              color: 'rgba(240,236,228,0.65)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              padding: '8px 16px',
              transition: 'color 0.2s',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
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
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
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

        {/* ── Mobile Hamburger Toggle Button ── */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="Toggle Navigation Menu"
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#f0ece4',
            cursor: 'pointer',
          }}
        >
          {mobileMenuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </nav>

      {/* ── Mobile Dropdown Drawer ── */}
      {mobileMenuOpen && (
        <div
          className="nav-mobile-menu"
          style={{
            background: 'rgba(10, 10, 10, 0.98)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '20px 28px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backdropFilter: 'blur(20px)',
          }}
        >
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0 }}>
            {NAV_ITEMS.map(item => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={e => handleNavClick(e, item.href)}
                  style={{
                    color: '#f0ece4',
                    textDecoration: 'none',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    display: 'block',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/github`}
              style={{
                color: '#f0ece4',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                padding: '12px',
                textAlign: 'center',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              Sign in
            </a>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/github`}
              style={{
                background: 'linear-gradient(135deg, #201927ff 0%, #272623ff 100%)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 700,
                padding: '12px',
                textAlign: 'center',
                borderRadius: '10px',
              }}
            >
              Get Started with GitHub
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

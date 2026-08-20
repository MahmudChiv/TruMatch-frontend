'use client';

import { useState } from 'react';

/* ─────────────────────────────────────────────────────────────
   Constants & data
───────────────────────────────────────────────────────────── */
const FONT = "var(--font-montserrat), Montserrat, sans-serif";
const TAGLINE = 'AI-powered commitment verification for developer teams.';

/* Navigation columns */
const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features',      href: '#features' },
      { label: 'How It Works',  href: '#how-it-works' },
      { label: 'Scoring',       href: '#scoring' },
      { label: 'Get Started',   href: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/github`, highlight: true },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',   href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Docs / API', href: '#' },
      { label: 'Blog',       href: '#' },
      { label: 'FAQ',        href: '#' },
    ],
  },
] as const;

/* ─────────────────────────────────────────────────────────────
   Logo — mirrors the one in Navbar
───────────────────────────────────────────────────────────── */
function FooterLogo() {
  return (
    <a href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg width="32" height="32" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="17" cy="17" r="16" stroke="url(#ft-lg1)" strokeWidth="1.5" />
        <circle cx="17" cy="17" r="8"  stroke="url(#ft-lg2)" strokeWidth="1" opacity="0.55" />
        <circle cx="17" cy="17" r="3"  fill="url(#ft-lg3)" />
        <circle cx="29" cy="17" r="2"   fill="#f59e0b" opacity="0.9" />
        <circle cx="9"  cy="8"  r="1.5" fill="#a855f7" opacity="0.8" />
        <circle cx="11" cy="27" r="1.5" fill="#10b981" opacity="0.8" />
        <defs>
          <linearGradient id="ft-lg1" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a855f7" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="ft-lg2" x1="9" y1="9" x2="25" y2="25" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10b981" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
          <radialGradient id="ft-lg3" cx="50%" cy="50%" r="50%">
            <stop stopColor="#f59e0b" />
            <stop offset="1" stopColor="#a855f7" />
          </radialGradient>
        </defs>
      </svg>
      <span style={{
        fontWeight: 700,
        fontSize: '1.15rem',
        letterSpacing: '-0.01em',
        background: 'linear-gradient(135deg, #f0ece4 0%, #c084fc 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontFamily: FONT,
      }}>
        TruMatch
      </span>
    </a>
  );
}

/* ─────────────────────────────────────────────────────────────
   Social icon button
───────────────────────────────────────────────────────────── */
interface SocialLinkProps {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function SocialIcon({ label, href, icon }: SocialLinkProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="ft-social-icon"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        background: hovered ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)',
        border: hovered ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(255,255,255,0.07)',
        color: hovered ? '#ffffff' : '#aaaaaa',
        transition: 'background 0.22s, border-color 0.22s, color 0.22s, transform 0.22s, box-shadow 0.22s',
        transform: hovered ? 'translateY(-2px) scale(1.08)' : 'scale(1)',
        boxShadow: hovered ? '0 4px 16px rgba(168,85,247,0.18)' : 'none',
        textDecoration: 'none',
        flexShrink: 0,
      }}
    >
      {icon}
    </a>
  );
}

/* GitHub icon */
const GitHubIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85.004 1.7.115 2.5.337 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.38.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.16.58.67.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
  </svg>
);

/* LinkedIn icon */
const LinkedInIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

/* X / Twitter icon */
const XIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
);

const SOCIALS: SocialLinkProps[] = [
  { label: 'GitHub',     href: 'https://github.com',   icon: GitHubIcon   },
  { label: 'LinkedIn',   href: 'https://linkedin.com', icon: LinkedInIcon },
  { label: 'X/Twitter',  href: 'https://x.com',        icon: XIcon        },
];

/* ─────────────────────────────────────────────────────────────
   Nav column
───────────────────────────────────────────────────────────── */
interface ColLink { label: string; href: string; highlight?: boolean }

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: readonly ColLink[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{
        fontSize: '0.72rem',
        fontWeight: 700,
        color: '#707070',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontFamily: FONT,
        margin: 0,
      }}>
        {heading}
      </h3>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {links.map((link, i) => (
          <li key={link.label}>
            <a
              href={link.href}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                fontSize: '0.88rem',
                color: link.highlight
                  ? (hoveredIdx === i ? '#ffffff' : '#d4d0cb')
                  : (hoveredIdx === i ? '#ffffff' : '#a0a0a0'),
                textDecoration: 'none',
                fontFamily: FONT,
                fontWeight: link.highlight ? 600 : 400,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s',
                position: 'relative',
              }}
            >
              {link.highlight && (
                <span style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#34d399',
                  display: 'inline-block',
                  boxShadow: '0 0 6px #34d399',
                  flexShrink: 0,
                }} />
              )}
              {link.label}
              {/* Slide-in underline on hover */}
              <span
                className="ft-link-underline"
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: link.highlight ? '11px' : 0,
                  right: 0,
                  height: '1px',
                  background: 'rgba(255,255,255,0.2)',
                  transform: hoveredIdx === i ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left center',
                  transition: 'transform 0.22s ease',
                }}
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────
   Bottom bar link
───────────────────────────────────────────────────────────── */
function BottomLink({ label, href }: { label: string; href: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: '0.78rem',
        color: hovered ? '#d0d0d0' : '#666666',
        textDecoration: hovered ? 'underline' : 'none',
        fontFamily: FONT,
        transition: 'color 0.2s',
      }}
    >
      {label}
    </a>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────── */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        position: 'relative',
        width: '100%',
        /*
         * Fully transparent — the SpaceBackground canvas is already
         * position:fixed behind the entire page (z-index 0). The
         * footer sits inside .content-layer (z-index 10) so making
         * our background transparent lets the live Three.js scene
         * (stars, orbital particles, mouse-parallax camera) show
         * through exactly as it does in the hero section.
         */
        background: 'transparent',
        fontFamily: FONT,
        overflow: 'visible',
      }}
    >
      {/* ── Responsive breakpoints ── */}
      <style>{`
        /* prefers-reduced-motion: disable hover transforms */
        @media (prefers-reduced-motion: reduce) {
          .ft-social-icon {
            transform: none !important;
            transition: color 0.2s !important;
          }
          .ft-link-underline {
            display: none !important;
          }
        }

        .ft-main-grid {
          width: 100%;
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 40px 48px;
          align-items: flex-start;
        }

        @media (max-width: 900px) and (min-width: 580px) {
          .ft-main-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 36px 32px !important;
          }
        }

        @media (max-width: 579px) {
          .ft-main-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            text-align: center !important;
          }
          .ft-brand-col {
            align-items: center !important;
            text-align: center !important;
            padding-bottom: 24px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .ft-brand-col p {
            max-width: 100% !important;
          }
        }

        .ft-bottom-bar {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          width: 100%;
          padding: 24px 0 32px;
          gap: 20px;
          flex-wrap: wrap;
        }

        @media (max-width: 640px) {
          .ft-bottom-bar {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 12px !important;
          }
        }
      `}</style>

      {/* ── Top gradient divider — separates footer from ConnectSection ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 30%, rgba(168,85,247,0.22) 50%, rgba(255,255,255,0.10) 70%, transparent 100%)',
        }}
      />

      {/* ══════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '72px 24px 0',
        }}
      >
        {/* ── Column grid ── */}
        <div className="ft-main-grid">
          {/* Brand column */}
          <div className="ft-brand-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FooterLogo />

            <p style={{
              fontSize: '0.85rem',
              color: '#8a8a8a',
              lineHeight: 1.82,
              fontFamily: FONT,
              margin: 0,
              maxWidth: '260px',
            }}>
              {TAGLINE}
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
              {SOCIALS.map(s => <SocialIcon key={s.label} {...s} />)}
            </div>
          </div>

          {/* Nav columns */}
          {COLUMNS.map(col => (
            <FooterColumn key={col.heading} heading={col.heading} links={col.links} />
          ))}
        </div>

        {/* ── Inner divider ── */}
        <div style={{
          marginTop: '60px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
        }} />

        {/* ── Bottom bar — Evenly distributed across available space ── */}
        <div className="ft-bottom-bar">
          {/* Copyright */}
          <p style={{ fontSize: '0.82rem', color: '#888888', fontFamily: FONT, margin: 0 }}>
            © {year} TruMatch. All rights reserved.
          </p>

          {/* Legal links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <BottomLink label="Privacy Policy"   href="#" />
            <BottomLink label="Terms of Service" href="#" />
          </div>

          {/* Personal touch */}
          <p style={{ fontSize: '0.82rem', color: '#888888', fontFamily: FONT, margin: 0 }}>
            Built with{' '}
            <span aria-label="love">❤️</span>
            {' '}in Lagos
          </p>
        </div>
      </div>
    </footer>
  );
}

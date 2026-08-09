'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const FONT = "'Edu VIC WA NT Hand', cursive";

/* ────────────────────────────────────────────────────────────────
   DATA
──────────────────────────────────────────────────────────────── */
export interface DevPoint {
  lat: number;
  lng: number;
  name: string;
  role: string;
  score: number;
  color: string;
  size: number;
  /** randomuser.me portrait index (1-99) */
  photoIndex: number;
  /** 'men' | 'women' */
  photoGender: 'men' | 'women';
}

export interface Arc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

const DEV_POINTS: DevPoint[] = [
  { lat: 40.7128,  lng: -74.006,   name: 'Jordan K.',  role: 'Full-Stack · TypeScript', score: 92, color: '#a855f7', size: 0.6,  photoIndex: 11, photoGender: 'men'   },
  { lat: 51.5074,  lng: -0.1278,   name: 'Maya S.',    role: 'ML Engineer · Python',    score: 88, color: '#f59e0b', size: 0.55, photoIndex: 44, photoGender: 'women' },
  { lat: 35.6762,  lng: 139.6503,  name: 'Kenji T.',   role: 'Rust / WASM',             score: 95, color: '#34d399', size: 0.65, photoIndex: 22, photoGender: 'men'   },
  { lat: 28.6139,  lng: 77.209,    name: 'Priya R.',   role: 'Backend · Go',            score: 91, color: '#f59e0b', size: 0.58, photoIndex: 53, photoGender: 'women' },
  { lat: -23.5505, lng: -46.6333,  name: 'Lucas M.',   role: 'iOS · Swift',             score: 84, color: '#a855f7', size: 0.5,  photoIndex: 33, photoGender: 'men'   },
  { lat: 48.8566,  lng: 2.3522,    name: 'Élise D.',   role: 'DevOps · Kubernetes',     score: 89, color: '#34d399', size: 0.56, photoIndex: 67, photoGender: 'women' },
  { lat: 37.5665,  lng: 126.978,   name: 'Hana J.',    role: 'React · Next.js',         score: 87, color: '#f59e0b', size: 0.52, photoIndex: 78, photoGender: 'women' },
  { lat: -33.8688, lng: 151.2093,  name: 'Liam P.',    role: 'Android · Kotlin',        score: 90, color: '#a855f7', size: 0.57, photoIndex: 45, photoGender: 'men'   },
  { lat: 52.52,    lng: 13.405,    name: 'Felix B.',   role: 'Graphics · WebGL',        score: 93, color: '#34d399', size: 0.6,  photoIndex: 7,  photoGender: 'men'   },
  { lat: 1.3521,   lng: 103.8198,  name: 'Ravi N.',    role: 'Cloud · AWS',             score: 86, color: '#f59e0b', size: 0.53, photoIndex: 14, photoGender: 'men'   },
  { lat: 6.5244,   lng: 3.3792,    name: 'Amara O.',   role: 'Frontend · Vue',          score: 85, color: '#a855f7', size: 0.51, photoIndex: 91, photoGender: 'women' },
  { lat: 55.7558,  lng: 37.6173,   name: 'Dmitri V.',  role: 'Systems · C++',           score: 94, color: '#34d399', size: 0.62, photoIndex: 62, photoGender: 'men'   },
];

const ARCS: Arc[] = [
  { startLat: 40.7128,  startLng: -74.006,  endLat: 51.5074,  endLng: -0.1278,  color: 'rgba(168,85,247,0.5)' },
  { startLat: 51.5074,  startLng: -0.1278,  endLat: 35.6762,  endLng: 139.6503, color: 'rgba(245,158,11,0.5)' },
  { startLat: 35.6762,  startLng: 139.6503, endLat: 28.6139,  endLng: 77.209,   color: 'rgba(52,211,153,0.5)' },
  { startLat: 28.6139,  startLng: 77.209,   endLat: 1.3521,   endLng: 103.8198, color: 'rgba(245,158,11,0.5)' },
  { startLat: 48.8566,  startLng: 2.3522,   endLat: 52.52,    endLng: 13.405,   color: 'rgba(52,211,153,0.5)' },
  { startLat: 52.52,    startLng: 13.405,   endLat: 55.7558,  endLng: 37.6173,  color: 'rgba(168,85,247,0.5)' },
  { startLat: -23.5505, startLng: -46.6333, endLat: 40.7128,  endLng: -74.006,  color: 'rgba(168,85,247,0.5)' },
  { startLat: 37.5665,  startLng: 126.978,  endLat: 35.6762,  endLng: 139.6503, color: 'rgba(52,211,153,0.5)' },
  { startLat: -33.8688, startLng: 151.2093, endLat: 37.5665,  endLng: 126.978,  color: 'rgba(245,158,11,0.5)' },
  { startLat: 6.5244,   startLng: 3.3792,   endLat: 51.5074,  endLng: -0.1278,  color: 'rgba(168,85,247,0.5)' },
  { startLat: 6.5244,   startLng: 3.3792,   endLat: 48.8566,  endLng: 2.3522,   color: 'rgba(52,211,153,0.5)' },
  { startLat: 1.3521,   startLng: 103.8198, endLat: -33.8688, endLng: 151.2093, color: 'rgba(245,158,11,0.5)' },
  { startLat: 55.7558,  startLng: 37.6173,  endLat: 28.6139,  endLng: 77.209,   color: 'rgba(52,211,153,0.5)' },
  { startLat: 40.7128,  startLng: -74.006,  endLat: -23.5505, endLng: -46.6333, color: 'rgba(245,158,11,0.5)' },
  { startLat: 52.52,    startLng: 13.405,   endLat: 6.5244,   endLng: 3.3792,   color: 'rgba(168,85,247,0.5)' },
];

/* ────────────────────────────────────────────────────────────────
   UTILITIES
──────────────────────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Reveal({
  children,
  delay = 0,
  direction = 'up',
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left';
}) {
  const { ref, inView } = useInView();
  const translate = direction === 'left' ? 'translateX(-28px)' : 'translateY(28px)';
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : translate,
      transition: `opacity 0.72s ease ${delay}s, transform 0.72s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

/* ── Dynamic import — no SSR ── */
const GlobeInner = dynamic(() => import('./GlobeInner'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: 580, height: 580,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#333', fontSize: '0.85rem', fontFamily: FONT,
    }}>
      Loading globe…
    </div>
  ),
});

/* ── Stat item ── */
function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{
        fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
        fontWeight: 800,
        color,
        fontFamily: FONT,
        lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{ fontSize: '0.82rem', color: '#4a4a4a', fontFamily: FONT, lineHeight: 1.4 }}>
        {label}
      </div>
    </div>
  );
}

/* ── Feature pill ── */
function FeaturePill({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '99px',
      padding: '7px 14px',
      fontSize: '0.8rem', color: '#7a7a7a', fontFamily: FONT,
    }}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   MAIN EXPORT
──────────────────────────────────────────────────────────────── */
export default function ConnectSection() {
  const [globeSize, setGlobeSize] = useState(580);

  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      if (w < 480) {
        setGlobeSize(Math.min(w - 32, 360));
      } else if (w < 640) {
        setGlobeSize(420);
      } else if (w < 900) {
        setGlobeSize(500);
      } else {
        setGlobeSize(580);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <section
      id="connect"
      style={{
        width: '100%',
        /* Distinct teal-tinted dark background — different from WhySection */
        background: 'linear-gradient(180deg, #05100e 0%, #070d0b 50%, #060c0a 100%)',
        borderTop:    '1px solid rgba(52,211,153,0.08)',
        borderBottom: '1px solid rgba(52,211,153,0.06)',
        padding: '110px 0 100px',
        fontFamily: FONT,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes glowPulse { 0%,100%{opacity:0.45} 50%{opacity:0.9} }
        @keyframes tipIn     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        /* Globe tooltip — injected by react-globe.gl into its own DOM */
        #globe-tooltip-connect {
          pointer-events: none !important;
        }

        @media (max-width: 1024px) {
          .connect-grid { flex-direction: column !important; align-items: center !important; }
          .connect-text { max-width: 100% !important; text-align: center !important; width: 100% !important; flex: 1 1 auto !important; align-items: center !important; }
          .connect-pills { justify-content: center !important; }
          .connect-stats { justify-content: center !important; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)) !important; width: 100% !important; }
        }
      `}</style>

      {/* ── Ambient glow (right side, behind globe) ── */}
      <div aria-hidden style={{
        position: 'absolute',
        top: '50%', right: '-120px',
        transform: 'translateY(-50%)',
        width: '650px', height: '650px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(52,211,153,0.06) 0%, rgba(168,85,247,0.04) 50%, transparent 75%)',
        pointerEvents: 'none',
        animation: 'glowPulse 5s ease-in-out infinite',
      }} />

      {/* ── Content wrapper ── */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '0 24px',
      }}>
        <div
          className="connect-grid"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '40px',
          }}
        >

          {/* ═══════════════════════════════
              LEFT — Text column
          ═══════════════════════════════ */}
          <div
            className="connect-text"
            style={{ flex: '0 0 440px', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '28px' }}
          >
            {/* Section badge */}
            <Reveal direction="left">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(52,211,153,0.08)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: '99px',
                padding: '5px 16px',
                fontSize: '0.75rem', fontWeight: 600, color: '#34d399',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#34d399', display: 'inline-block',
                  boxShadow: '0 0 7px #34d399',
                }} />
                Global Developer Network
              </div>
            </Reveal>

            {/* Heading */}
            <Reveal direction="left" delay={0.07}>
              <h2 style={{
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                fontWeight: 700,
                color: '#f2f2f2',
                lineHeight: 1.14,
                letterSpacing: '-0.01em',
                fontFamily: FONT,
                margin: 0,
              }}>
                Trusted teammates,{' '}
                <span style={{ color: '#2d3d35' }}>no matter the&nbsp;distance.</span>
              </h2>
            </Reveal>

            {/* Body */}
            <Reveal direction="left" delay={0.14}>
              <p style={{
                fontSize: 'clamp(0.92rem, 1.6vw, 1.02rem)',
                color: '#505050',
                lineHeight: 1.85,
                fontFamily: FONT,
                margin: 0,
              }}>
                TruMatch connects developers across six continents through
                commitment scores and verified GitHub behaviour — so geography
                never decides who you can trust to ship alongside you.
                Watch the glowing points to discover devs already committed to shipping.
              </p>
            </Reveal>

            {/* Feature pills */}
            <Reveal direction="left" delay={0.2}>
              <div className="connect-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <FeaturePill icon="🌐" text="6 continents covered" />
                <FeaturePill icon="🔒" text="Commitment verified" />
                <FeaturePill icon="⚡" text="Async-first teams" />
                <FeaturePill icon="🤝" text="No cold-start trust" />
              </div>
            </Reveal>

            {/* Divider */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(52,211,153,0.15), transparent)', borderRadius: '1px' }} />

            {/* Stats grid */}
            <Reveal direction="left" delay={0.26}>
              <div
                className="connect-stats"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px 20px',
                }}
              >
                <Stat value="180+" label="Countries represented"      color="#34d399" />
                <Stat value="24/7" label="Async collaboration"         color="#a855f7" />
                <Stat value="0"    label="Physical presence needed"    color="#f59e0b" />
                <Stat value="100%" label="Commitment verified upfront"  color="#34d399" />
              </div>
            </Reveal>

            {/* CTA */}
            <Reveal direction="left" delay={0.32}>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/github`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(168,85,247,0.10))',
                  border: '1px solid rgba(52,211,153,0.25)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  color: '#34d399',
                  fontSize: '0.9rem', fontWeight: 700,
                  textDecoration: 'none',
                  fontFamily: FONT,
                  transition: 'background 0.22s, border-color 0.22s, transform 0.22s',
                  alignSelf: 'flex-start',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(168,85,247,0.16))';
                  el.style.borderColor = 'rgba(52,211,153,0.45)';
                  el.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(168,85,247,0.10))';
                  el.style.borderColor = 'rgba(52,211,153,0.25)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                Find your global teammate
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </a>
            </Reveal>
          </div>

          {/* ═══════════════════════════════
              RIGHT — Globe
          ═══════════════════════════════ */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
          }}>
            <GlobeInner
              pointsData={DEV_POINTS}
              arcsData={ARCS}
              width={globeSize}
              height={globeSize}
            />
          </div>

        </div>
      </div>
    </section>
  );
}

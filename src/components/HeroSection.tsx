'use client';

import { useEffect, useState } from 'react';

function buildGithubAuthUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const callbackUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : '/auth/callback';
  return `${apiUrl}/auth/github?return_to=${encodeURIComponent(callbackUrl)}`;
}

/* ────────────────────────────────────────────────
   Colour palette — warm, black-grey theme, no blue
──────────────────────────────────────────────── */
interface WordDef { text: string; color: string; }

const HEADLINE_WORDS: WordDef[] = [
  { text: 'Find ',       color: '#8a8782ff' },          // cream white
  { text: 'Teammates ',  color: '#3e3942ff' },          // light purple
  { text: 'Who ',        color: '#f0ece4' },
  { text: 'Actually ',   color: '#685b47ff' },          // amber
  { text: 'Deliver.',    color: '#32372dff' },          // lime
];

const SUBTITLE =
  'TruMatch scores developer commitment from real GitHub behaviour, conducts an AI interview, then matches you with teammates whose track record backs up their promises.';

/* ── Headline typewriter ── */
function AnimatedHeadline() {
  const fullText = HEADLINE_WORDS.map(w => w.text).join('');
  const [charCount, setCharCount]  = useState(0);
  const [phase, setPhase] = useState<'idle' | 'typing' | 'done'>('idle');

  useEffect(() => {
    const delay = setTimeout(() => setPhase('typing'), 300);
    return () => clearTimeout(delay);
  }, []);

  useEffect(() => {
    if (phase !== 'typing') return;
    let i = charCount;
    const interval = setInterval(() => {
      i++;
      setCharCount(i);
      if (i >= fullText.length) { clearInterval(interval); setPhase('done'); }
    }, 35);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* Reconstruct per-word coloured spans */
  const rendered: React.ReactNode[] = [];
  let cursor = 0;
  for (let wi = 0; wi < HEADLINE_WORDS.length; wi++) {
    const { text, color } = HEADLINE_WORDS[wi];
    const visible = fullText.slice(cursor, Math.min(charCount, cursor + text.length));
    if (visible.length > 0) {
      rendered.push(
        <span
          key={wi}
          style={{
            color,
            textShadow: color !== '#f0ece4' ? `0 0 36px ${color}50` : 'none',
          }}
        >
          {visible}
        </span>
      );
    }
    cursor += text.length;
    if (charCount <= cursor - text.length + visible.length - 1) break;
  }

  return (
    <h1
      style={{
        fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
        fontWeight: 700,
        lineHeight: 1.12,
        letterSpacing: '-0.01em',
        textAlign: 'center',
        maxWidth: '860px',
        margin: '0 auto',
        fontFamily: 'var(--font-edu-hand), cursive',
      }}
    >
      {rendered}
      {phase === 'typing' && (
        <span style={{
          display: 'inline-block',
          width: '3px',
          height: '0.82em',
          background: '#a855f7',
          marginLeft: '4px',
          verticalAlign: 'middle',
          animation: 'blink 0.7s step-end infinite',
        }} />
      )}
    </h1>
  );
}

/* ── Subtitle typewriter ── */
function AnimatedSubtitle({ delay }: { delay: number }) {
  const [displayed, setDisplayed] = useState('');
  const [visible, setVisible] = useState(false);
  const [cursorOn, setCursorOn] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => { setVisible(true); setCursorOn(true); }, delay);
    return () => clearTimeout(t1);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(SUBTITLE.slice(0, i));
      if (i >= SUBTITLE.length) { clearInterval(interval); setCursorOn(false); }
    }, 15);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <p
      style={{
        fontSize: 'clamp(1rem, 2vw, 1.15rem)',
        color: 'rgba(240,236,228,0.65)',
        maxWidth: '660px',
        margin: '0 auto',
        textAlign: 'center',
        lineHeight: 1.75,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
        minHeight: '4em',
        fontFamily: 'var(--font-edu-hand), cursive',
      }}
    >
      {displayed}
      {cursorOn && (
        <span style={{
          display: 'inline-block',
          width: '2px',
          height: '1em',
          background: '#f59e0b',
          marginLeft: '2px',
          verticalAlign: 'middle',
          animation: 'blink 0.7s step-end infinite',
        }} />
      )}
    </p>
  );
}

/* ── Mock app screen shown inside the video container ── */
function MockAppScreen() {
  return (
    <div style={{ width: '100%', height: '100%', padding: '36px 28px 16px', display: 'flex', gap: '18px' }}>
      {/* Sidebar */}
      <div style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {['Dashboard','My Score','Find Teammates','Matches','Team Charter','Ratings'].map((item, i) => (
          <div key={item} style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: i === 2 ? 'rgba(168,85,247,0.18)' : 'transparent',
            color: i === 2 ? '#c084fc' : 'rgba(200,196,190,0.45)',
            fontSize: '0.78rem',
            fontWeight: i === 2 ? 600 : 400,
            fontFamily: 'var(--font-edu-hand), cursive',
          }}>
            {item}
          </div>
        ))}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f0ece4', fontFamily: 'var(--font-edu-hand), cursive' }}>
          Find Teammates
        </div>
        <div style={{ display: 'flex', gap: '14px', flex: 1 }}>
          {/* Score card */}
          <div style={{
            background: 'rgba(168,85,247,0.08)',
            border: '1px solid rgba(168,85,247,0.2)',
            borderRadius: '12px',
            padding: '14px',
            flex: '0 0 130px',
          }}>
            <div style={{ fontSize: '0.6rem', color: 'rgba(200,196,190,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-edu-hand), cursive' }}>
              Your Commitment
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#84cc16', fontFamily: 'var(--font-edu-hand), cursive' }}>87</div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(200,196,190,0.4)', fontFamily: 'var(--font-edu-hand), cursive' }}>/ 100</div>
            <div style={{ marginTop: '10px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: '87%', height: '100%', background: 'linear-gradient(90deg, #84cc16, #a855f7)', borderRadius: '2px' }} />
            </div>
          </div>

          {/* Candidates */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { name: 'Alex Chen',  score: 92, skill: 'Rust / WASM',  color: '#f59e0b' },
              { name: 'Priya Rao',  score: 88, skill: 'ML / Python',  color: '#a855f7' },
              { name: 'Marco B.',   score: 79, skill: 'React / TS',   color: '#84cc16' },
            ].map(c => (
              <div key={c.name} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px', padding: '8px 12px',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${c.color}22`,
                  border: `1px solid ${c.color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 700, color: c.color,
                  fontFamily: 'var(--font-edu-hand), cursive',
                }}>
                  {c.name.slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f0ece4', fontFamily: 'var(--font-edu-hand), cursive' }}>{c.name}</div>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(200,196,190,0.45)', fontFamily: 'var(--font-edu-hand), cursive' }}>{c.skill}</div>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: c.color, fontFamily: 'var(--font-edu-hand), cursive' }}>{c.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Demo video player ── */
function DemoVideo() {
  const [playing, setPlaying] = useState(false);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto',
      borderRadius: '20px',
      overflow: 'hidden',
      border: '1px solid rgba(168,85,247,0.18)',
      boxShadow: '0 0 80px rgba(168,85,247,0.10), 0 40px 100px rgba(0,0,0,0.6)',
      background: 'rgba(16,16,16,0.95)',
      aspectRatio: '16/9',
    }}>
      <MockAppScreen />

      {/* Play overlay */}
      {!playing && (
        <button
          onClick={() => setPlaying(true)}
          aria-label="Play demo video"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10,10,10,0.52)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(10,10,10,0.35)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(10,10,10,0.52)')}
        >
          <div style={{
            width: '74px', height: '74px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #201927ff 0%, #272623ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(168,85,247,0.45)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => {
              const d = e.currentTarget as HTMLDivElement;
              d.style.transform = 'scale(1.08)';
              d.style.boxShadow = '0 0 60px rgba(168,85,247,0.65)';
            }}
            onMouseLeave={e => {
              const d = e.currentTarget as HTMLDivElement;
              d.style.transform = 'scale(1)';
              d.style.boxShadow = '0 0 40px rgba(168,85,247,0.45)';
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span style={{
            color: 'rgba(240,236,228,0.8)',
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-edu-hand), cursive',
          }}>
            Watch Demo · 2 min
          </span>
        </button>
      )}

      {playing && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'rgba(10,10,10,0.7)',
            borderRadius: '10px', padding: '10px 20px',
            color: '#34d399', fontSize: '0.85rem', fontWeight: 500,
            fontFamily: 'var(--font-edu-hand), cursive',
          }}>
            ▶ Playing demo…
          </div>
        </div>
      )}

      {/* Browser chrome bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '36px',
        background: 'rgba(12,12,12,0.95)',
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        zIndex: 2,
      }}>
        {['#f43f5e', '#f59e0b', '#34d399'].map(c => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.75 }} />
        ))}
        <div style={{ flex: 1, height: 17, background: 'rgba(255,255,255,0.05)', borderRadius: 4, maxWidth: 220, margin: '0 auto' }} />
      </div>
    </div>
  );
}

/* ── Main Hero ── */
const HEADLINE_CHAR_COUNT = HEADLINE_WORDS.reduce((s, w) => s + w.text.length, 0);
const HEADLINE_DURATION   = HEADLINE_CHAR_COUNT * 35 + 300;

export default function HeroSection() {
  const [authUrl, setAuthUrl] = useState('');

  useEffect(() => {
    setAuthUrl(buildGithubAuthUrl());
  }, []);

  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
        gap: '52px',
        fontFamily: 'var(--font-edu-hand), cursive',
      }}
    >
      <style>{`
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Text block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', width: '100%' }}>

        {/* Eye-brow pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(168,85,247,0.1)',
          border: '1px solid rgba(168,85,247,0.22)',
          borderRadius: '99px',
          padding: '6px 18px',
          fontSize: '0.8rem', fontWeight: 600, color: '#c084fc',
          letterSpacing: '0.05em',
          animation: 'fadeUp 0.6s ease both',
          fontFamily: 'var(--font-edu-hand), cursive',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#84cc16',
            display: 'inline-block',
            boxShadow: '0 0 8px #84cc16',
          }} />
          AI-Powered Commitment Verification
        </div>

        <AnimatedHeadline />
        <AnimatedSubtitle delay={HEADLINE_DURATION} />

        {/* CTA row */}
        <div style={{
          display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeUp 0.6s ease both', animationDelay: '0.4s',
        }}>
          <a
            href={authUrl}
            style={{
              background: 'linear-gradient(135deg, #201927ff 0%, #272623ff 100%)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700, fontSize: '0.95rem',
              padding: '14px 30px', borderRadius: '12px',
              transition: 'transform 0.2s, opacity 0.2s, box-shadow 0.2s',
              boxShadow: '0 0 28px rgba(168,85,247,0.28)',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontFamily: 'var(--font-edu-hand), cursive',
            }}
            onMouseEnter={e => {
              const a = e.currentTarget as HTMLAnchorElement;
              a.style.transform = 'translateY(-2px)';
              a.style.boxShadow = '0 0 48px rgba(168,85,247,0.48)';
            }}
            onMouseLeave={e => {
              const a = e.currentTarget as HTMLAnchorElement;
              a.style.transform = 'translateY(0)';
              a.style.boxShadow = '0 0 28px rgba(168,85,247,0.28)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85.004 1.7.115 2.5.337 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.38.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.16.58.67.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
            </svg>
            Sign up with GitHub
          </a>
          <a
            href="#how-it-works"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(240,236,228,0.8)',
              textDecoration: 'none',
              fontWeight: 600, fontSize: '0.95rem',
              padding: '14px 28px', borderRadius: '12px',
              transition: 'background 0.2s, border-color 0.2s',
              fontFamily: 'var(--font-edu-hand), cursive',
            }}
            onMouseEnter={e => {
              const a = e.currentTarget as HTMLAnchorElement;
              a.style.background = 'rgba(255,255,255,0.08)';
              a.style.borderColor = 'rgba(255,255,255,0.16)';
            }}
            onMouseLeave={e => {
              const a = e.currentTarget as HTMLAnchorElement;
              a.style.background = 'rgba(255,255,255,0.04)';
              a.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            How It Works
          </a>
        </div>

        {/* Social proof strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '20px',
          fontSize: '0.8rem', color: 'rgba(200,196,190,0.45)',
          animation: 'fadeUp 0.6s ease both', animationDelay: '0.6s',
          fontFamily: 'var(--font-edu-hand), cursive',
        }}>
          <span>✦ Free during beta</span>
          <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)', display: 'inline-block' }} />
          <span>✦ GitHub login only</span>
          <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)', display: 'inline-block' }} />
          <span>✦ No card required</span>
        </div>
      </div>

      {/* Demo video */}
      <div style={{ width: '100%', animation: 'fadeUp 0.8s ease both', animationDelay: '0.8s' }}>
        <DemoVideo />
      </div>
    </section>
  );
}

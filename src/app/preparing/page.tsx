'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import type { GithubSyncCompleteEvent } from '@/lib/api/types';

// ─── Message carousel definitions ────────────────────────────────────────────
interface Message {
  text: string;
  animation: 'slide-left' | 'fade-up' | 'fall-down' | 'typewriter' | 'scale-pop' | 'slide-right';
  sub?: string;
}

const MESSAGES: Message[] = [
  {
    text: 'Getting your interview ready',
    animation: 'slide-left',
    sub: 'Connecting to GitHub and pulling your history…',
  },
  {
    text: 'We are honoured to have you',
    animation: 'fade-up',
    sub: 'Every line of code you wrote brought you here.',
  },
  {
    text: 'Committed partners await you',
    animation: 'fall-down',
    sub: 'Find teammates who actually follow through.',
  },
  {
    text: 'Analysing your GitHub signal',
    animation: 'typewriter',
    sub: 'Commit patterns · PR completion · Issue resolution',
  },
  {
    text: 'Consistency is the new currency',
    animation: 'scale-pop',
    sub: 'The teams that ship are the ones who show up.',
  },
  {
    text: 'Build something that lasts',
    animation: 'slide-right',
    sub: 'TruMatch pairs you with people who mean it.',
  },
];

const MESSAGE_DURATION = 5000; // ms per message

// ─── Component ───────────────────────────────────────────────────────────────
function PreparingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('uid');

  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [typewriterText, setTypewriterText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dots, setDots] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const completedRef = useRef(false);

  // ── WebSocket setup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const socket = io(`${backendUrl}/github-sync`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', { userId });
    });

    socket.on('github-sync:complete', (data: GithubSyncCompleteEvent) => {
      if (completedRef.current) return;
      completedRef.current = true;
      if (data.status === 'complete') {
        setTimeout(() => router.push('/interview'), 800);
      } else {
        setError(data.error ?? 'Something went wrong analysing your GitHub data.');
      }
    });

    socket.on('connect_error', () => {
      // Silently tolerate — job still runs in background
    });

    return () => { socket.disconnect(); };
  }, [userId, router]);

  // ── Message carousel ─────────────────────────────────────────────────────
  const advanceMessage = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
      setTypewriterText('');
      setVisible(true);
    }, 400);
  }, []);

  useEffect(() => {
    const timer = setInterval(advanceMessage, MESSAGE_DURATION);
    return () => clearInterval(timer);
  }, [advanceMessage]);

  // ── Typewriter ────────────────────────────────────────────────────────────
  const currentMsg = MESSAGES[msgIndex];
  useEffect(() => {
    if (currentMsg.animation !== 'typewriter' || !visible) return;
    setTypewriterText('');
    let i = 0;
    const full = currentMsg.text;
    const timer = setInterval(() => {
      i++;
      setTypewriterText(full.slice(0, i));
      if (i >= full.length) clearInterval(timer);
    }, 48);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgIndex, visible]);

  // ── Animated dots ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const displayText =
    currentMsg.animation === 'typewriter' ? typewriterText : currentMsg.text;

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="prep-root">
        <div className="prep-grid" aria-hidden="true" />
        <div className="prep-orb prep-orb-tl" aria-hidden="true" />
        <div className="prep-orb prep-orb-br" aria-hidden="true" />
        <div className="prep-error-card">
          <span className="prep-error-icon" aria-hidden="true">⚠</span>
          <h2 className="prep-error-title">Sync failed</h2>
          <p className="prep-error-body">{error}</p>
          <button
            className="prep-retry-btn"
            onClick={() => {
              setError(null);
              completedRef.current = false;
              fetch('/api/github-sync', { method: 'POST' }).catch(() => null);
            }}
          >
            Retry
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="prep-root">
      {/* Animated grid */}
      <div className="prep-grid" aria-hidden="true" />

      {/* White/grey orb accents — no colour */}
      <div className="prep-orb prep-orb-tl" aria-hidden="true" />
      <div className="prep-orb prep-orb-br" aria-hidden="true" />

      {/* Brand — top left */}
      <div className="prep-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="TruMatch" width={26} height={26} className="prep-logo" />
        <span className="prep-brand-text">TruMatch</span>
      </div>

      {/* Main message */}
      <main className="prep-main">
        <div
          key={msgIndex}
          className={`prep-msg prep-msg-${currentMsg.animation} ${visible ? 'prep-msg-in' : 'prep-msg-out'}`}
        >
          <p className="prep-headline">
            {displayText}
            {currentMsg.animation === 'typewriter' && visible && (
              <span className="prep-cursor" aria-hidden="true">|</span>
            )}
          </p>
          {currentMsg.sub && (
            <p className="prep-sub">{currentMsg.sub}</p>
          )}
        </div>

        {/* Step indicator */}
        <div className="prep-steps" aria-label="Progress">
          {MESSAGES.map((_, i) => (
            <span
              key={i}
              className={`prep-step${i === msgIndex ? ' prep-step-active' : ''}`}
            />
          ))}
        </div>
      </main>

      {/* Footer status */}
      <footer className="prep-footer">
        <span className="prep-spinner" aria-hidden="true" />
        <span className="prep-status">Analysing your GitHub history{dots}</span>
      </footer>

      <style>{styles}</style>
    </div>
  );
}

export default function PreparingPage() {
  return (
    <Suspense
      fallback={
        <div className="prep-root">
          <div className="prep-grid" aria-hidden="true" />
          <div className="prep-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="TruMatch" width={26} height={26} className="prep-logo" />
            <span className="prep-brand-text">TruMatch</span>
          </div>
          <footer className="prep-footer">
            <span className="prep-spinner" aria-hidden="true" />
            <span className="prep-status">Preparing interview environment…</span>
          </footer>
          <style>{styles}</style>
        </div>
      }
    >
      <PreparingContent />
    </Suspense>
  );
}

// ─── Scoped styles ────────────────────────────────────────────────────────────
// DESIGN RULES:
//   • Palette: whites, greys, blacks only — no blue, purple, yellow, green
//   • Background token: var(--bg-primary) = #0a0a0a (not pure #000)
//   • Text tokens: var(--text-primary) = #f2f2f2, var(--text-secondary) = #a0a0a0
//   • Font: var(--font-edu-hand) — the one font used across the whole app
// ─────────────────────────────────────────────────────────────────────────────
const styles = `
  .prep-root {
    min-height: 100svh;
    background: linear-gradient(180deg, #05100e 0%, #070d0b 50%, #060c0a 100%);
    color: var(--text-primary, #f2f2f2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    font-family: var(--font-edu-hand), cursive;
  }

  /* ── Animated grid — same as used across the landing page ── */
  .prep-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
    background-size: 76px 76px;
    animation: prep-grid-scroll 22s linear infinite;
    pointer-events: none;
    z-index: 0;
  }
  @keyframes prep-grid-scroll {
    0%   { background-position: 0 0; }
    100% { background-position: 76px 76px; }
  }

  /* ── Soft grey orbs — no colour, just depth ── */
  .prep-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    opacity: 0.055;
    pointer-events: none;
    animation: prep-drift 10s ease-in-out infinite alternate;
    z-index: 0;
  }
  .prep-orb-tl {
    width: 560px; height: 560px;
    background: #ffffff;
    top: -180px; left: -160px;
    animation-delay: 0s;
  }
  .prep-orb-br {
    width: 440px; height: 440px;
    background: #aaaaaa;
    bottom: -140px; right: -120px;
    animation-delay: -5s;
  }
  @keyframes prep-drift {
    0%   { transform: translate(0, 0) scale(1); }
    100% { transform: translate(22px, -28px) scale(1.06); }
  }

  /* ── Brand — top left ── */
  .prep-brand {
    position: absolute;
    top: 2rem;
    left: 2.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    user-select: none;
    z-index: 10;
    text-decoration: none;
  }
  .prep-logo {
    display: block;
    opacity: 0.85;
  }
  .prep-brand-text {
    font-family: var(--font-edu-hand), cursive;
    font-weight: 700;
    font-size: 1.05rem;
    letter-spacing: -0.01em;
    color: var(--text-primary, #f2f2f2);
    opacity: 0.75;
  }

  /* ── Main message block ── */
  .prep-main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.25rem;
    text-align: center;
    padding: 0 1.5rem;
    max-width: 640px;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .prep-msg {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.7rem;
    width: 100%;
    transition: opacity 0.35s ease;
  }
  .prep-msg-out { opacity: 0; }
  .prep-msg-in  { opacity: 1; }

  /* ── Headline ── */
  .prep-headline {
    font-family: var(--font-edu-hand), cursive;
    font-size: clamp(1.65rem, 5vw, 2.85rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.14;
    color: var(--text-primary, #f2f2f2);
  }

  /* Typewriter cursor */
  .prep-cursor {
    display: inline-block;
    font-size: clamp(1.65rem, 5vw, 2.85rem);
    line-height: 1.14;
    color: var(--text-muted, #525252);
    animation: prep-blink 0.85s step-end infinite;
    margin-left: 3px;
  }
  @keyframes prep-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }

  /* ── Sub copy ── */
  .prep-sub {
    font-family: var(--font-edu-hand), cursive;
    font-size: clamp(0.8rem, 2vw, 0.975rem);
    color: var(--text-secondary, #a0a0a0);
    font-weight: 400;
    letter-spacing: 0.01em;
    max-width: 420px;
    line-height: 1.65;
  }

  /* ── Animation variants ── */
  .prep-msg-slide-left.prep-msg-in {
    animation: prep-slide-left 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes prep-slide-left {
    from { opacity: 0; transform: translateX(-55px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .prep-msg-slide-right.prep-msg-in {
    animation: prep-slide-right 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes prep-slide-right {
    from { opacity: 0; transform: translateX(55px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .prep-msg-fade-up.prep-msg-in {
    animation: prep-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes prep-fade-up {
    from { opacity: 0; transform: translateY(26px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .prep-msg-fall-down.prep-msg-in {
    animation: prep-fall-down 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  @keyframes prep-fall-down {
    from { opacity: 0; transform: translateY(-46px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .prep-msg-typewriter.prep-msg-in {
    animation: prep-fade-quick 0.25s ease both;
  }
  @keyframes prep-fade-quick {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .prep-msg-scale-pop.prep-msg-in {
    animation: prep-scale-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  @keyframes prep-scale-pop {
    from { opacity: 0; transform: scale(0.78); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Step indicators ── */
  .prep-steps {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }
  .prep-step {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255,255,255,0.15);
    transition: width 0.3s ease, background 0.3s ease, border-radius 0.3s ease;
  }
  .prep-step-active {
    width: 20px;
    border-radius: 3px;
    background: rgba(255,255,255,0.7);
  }

  /* ── Footer ── */
  .prep-footer {
    position: absolute;
    bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-family: var(--font-edu-hand), cursive;
    font-size: 0.77rem;
    color: var(--text-muted, #525252);
    letter-spacing: 0.05em;
    user-select: none;
    z-index: 1;
  }
  .prep-spinner {
    width: 13px;
    height: 13px;
    border: 1.5px solid rgba(255,255,255,0.1);
    border-top-color: rgba(255,255,255,0.45);
    border-radius: 50%;
    animation: prep-spin 0.85s linear infinite;
    flex-shrink: 0;
  }
  @keyframes prep-spin {
    to { transform: rotate(360deg); }
  }
  .prep-status {
    font-family: var(--font-edu-hand), cursive;
  }

  /* ── Error card ── */
  .prep-error-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    background: var(--surface, #161616);
    border: 1px solid var(--border, rgba(255,255,255,0.07));
    border-radius: 1.25rem;
    padding: 2.75rem 2.5rem;
    max-width: 400px;
    text-align: center;
    position: relative;
    z-index: 1;
  }
  .prep-error-icon {
    font-size: 1.75rem;
    color: var(--text-secondary, #a0a0a0);
  }
  .prep-error-title {
    font-family: var(--font-edu-hand), cursive;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary, #f2f2f2);
  }
  .prep-error-body {
    font-family: var(--font-edu-hand), cursive;
    font-size: 0.9rem;
    color: var(--text-secondary, #a0a0a0);
    line-height: 1.6;
  }
  .prep-retry-btn {
    font-family: var(--font-edu-hand), cursive;
    margin-top: 0.4rem;
    padding: 0.6rem 1.6rem;
    border-radius: 0.7rem;
    border: 1px solid var(--border-mid, rgba(255,255,255,0.11));
    background: var(--surface-raised, #1c1c1c);
    color: var(--text-primary, #f2f2f2);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease;
  }
  .prep-retry-btn:hover {
    background: var(--surface-alt, #222);
    border-color: var(--border-light, rgba(255,255,255,0.15));
  }
`;

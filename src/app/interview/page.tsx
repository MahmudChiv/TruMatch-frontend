'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import type {
  InterviewChunkEvent,
  InterviewMessageCompleteEvent,
  InterviewCompleteEvent,
  InterviewErrorEvent,
  InterviewResumeResponseEvent,
  UserProfile,
} from '@/lib/api/types';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  isStreaming?: boolean;
}

type InterviewState = 'loading' | 'intro' | 'interviewing' | 'completed' | 'error';

export default function InterviewPage() {
  const router = useRouter();

  // User state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionState, setSessionState] = useState<InterviewState>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Final outcome state
  const [finalResult, setFinalResult] = useState<InterviewCompleteEvent | null>(null);
  const [isFinishedReady, setIsFinishedReady] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isNavigatingToDashboard, setIsNavigatingToDashboard] = useState(false);

  // Socket, Auto-scroll & Focus refs
  const socketRef = useRef<Socket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeChunkTextRef = useRef<string>('');

  // ── 1. Fetch authenticated user + check interview status ──────────────────
  useEffect(() => {
    let cancelled = false;

    async function checkStatusAndLoad() {
      try {
        const meRes = await fetch('/api/me');
        if (!meRes.ok) throw new Error('Unauthorized');
        const userData: UserProfile = await meRes.json();

        if (cancelled) return;
        setUser(userData);

        // Check if interview is already complete — redirect to dashboard if so.
        // The interview is a one-time onboarding step and cannot be retaken.
        const dashRes = await fetch('/api/dashboard');
        if (!cancelled && dashRes.ok) {
          const dash = await dashRes.json();
          if (dash?.interviewSession?.status === 'complete') {
            router.replace('/dashboard');
            return;
          }
        }

        if (!cancelled) setSessionState('intro');
      } catch {
        if (!cancelled) {
          // Fallback user state — still show intro (API will reject if truly unauthorized)
          setUser({
            id: 'me',
            githubId: 'github-user',
            username: 'Developer',
            commitmentScore: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setSessionState('intro');
        }
      }
    }

    checkStatusAndLoad();
    return () => { cancelled = true; };
  }, [router]);

  // Prefetch dashboard when score is revealed
  useEffect(() => {
    if (sessionState === 'completed') {
      router.prefetch('/dashboard');
    }
  }, [sessionState, router]);

  // ── 2. Initialize Socket Connection ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(`${backendUrl}/interview`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', { userId: user.id });
    });

    socket.on('disconnect', () => {
      setIsDisconnected(true);
      setIsAiTyping(false);
    });

    socket.on('interview:resumed', (data: InterviewResumeResponseEvent) => {
      if (data && data.resumed) {
        const reconstructed: ChatMessage[] = (data.transcript || []).map((entry, idx) => ({
          id: `resumed-${idx}-${Date.now()}`,
          role: entry.role,
          text: entry.content,
          isStreaming: false,
        }));

        setMessages(reconstructed);
        if (data.sessionId) setSessionId(data.sessionId);
        if (data.isFinished) setIsFinishedReady(true);
        setIsDisconnected(false);
        setIsReconnecting(false);
        setIsAiTyping(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    });

    // Handle incoming AI text chunks
    socket.on('interview:chunk', (data: InterviewChunkEvent) => {
      activeChunkTextRef.current += data.chunk;
      const updatedText = activeChunkTextRef.current;

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, text: updatedText },
          ];
        } else {
          return [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              text: updatedText,
              isStreaming: true,
            },
          ];
        }
      });
      setIsAiTyping(true);
    });

    // Handle turn complete
    socket.on('interview:message-complete', (data: InterviewMessageCompleteEvent) => {
      activeChunkTextRef.current = '';
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, text: data.fullText, isStreaming: false },
          ];
        }
        return [
          ...prev,
          { id: `ai-${Date.now()}`, role: 'assistant', text: data.fullText, isStreaming: false },
        ];
      });
      setIsAiTyping(false);

      if (data.isInterviewFinished) {
        setIsFinishedReady(true);
      }
    });

    // Handle full interview completion
    socket.on('interview:complete', (data: InterviewCompleteEvent) => {
      setIsAiTyping(false);
      setIsFinishing(false);
      setFinalResult(data);
      setSessionState('completed');
    });

    // Handle interview error
    socket.on('interview:error', (data: InterviewErrorEvent) => {
      setIsAiTyping(false);
      setIsFinishing(false);
      setErrorReason(data.reason || 'An error occurred during your interview.');
      setSessionState('error');
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // ── Auto scroll chat ────────────────────────────────────────────────────────
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  // ── Maintain input focus ───────────────────────────────────────────────────
  useEffect(() => {
    if (sessionState === 'interviewing' && !isAiTyping) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [sessionState, isAiTyping]);

  // ── User actions ─────────────────────────────────────────────────────────────
  const startInterview = () => {
    if (!socketRef.current || !user) return;
    setSessionState('interviewing');
    setMessages([]);
    setIsAiTyping(true);
    activeChunkTextRef.current = '';
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);

    socketRef.current.emit('interview:start', { userId: user.id }, (res: { sessionId?: string }) => {
      if (res?.sessionId) {
        setSessionId(res.sessionId);
      }
    });
  };

  const handleReconnect = () => {
    if (!socketRef.current || !user) return;
    setIsReconnecting(true);

    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }

    socketRef.current.emit(
      'interview:resume',
      { userId: user.id },
      (res: InterviewResumeResponseEvent) => {
        if (res && res.resumed) {
          const reconstructed: ChatMessage[] = (res.transcript || []).map((entry, idx) => ({
            id: `resumed-${idx}-${Date.now()}`,
            role: entry.role,
            text: entry.content,
            isStreaming: false,
          }));

          setMessages(reconstructed);
          if (res.sessionId) setSessionId(res.sessionId);
          if (res.isFinished) setIsFinishedReady(true);
          setIsDisconnected(false);
          setIsReconnecting(false);
          setIsAiTyping(false);
          setTimeout(() => textareaRef.current?.focus(), 100);
        } else {
          setIsReconnecting(false);
          setIsDisconnected(false);
          startInterview();
        }
      },
    );
  };

  const handleSendAnswer = () => {
    if (!currentAnswer.trim() || isAiTyping || !socketRef.current || !user) return;

    const answerText = currentAnswer.trim();
    setCurrentAnswer('');

    // Append user message immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: answerText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);
    activeChunkTextRef.current = '';
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);

    socketRef.current.emit('interview:answer', {
      userId: user.id,
      sessionId: sessionId || 'active-session',
      answer: answerText,
    });
  };

  const handleManualComplete = () => {
    if (!socketRef.current || !user || isFinishing) return;
    setIsFinishing(true);
    socketRef.current.emit('interview:finish', {
      userId: user.id,
      sessionId: sessionId || 'active-session',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAnswer();
    }
  };

  // ── Render States ────────────────────────────────────────────────────────────

  if (sessionState === 'loading') {
    return (
      <div className="iv-root">
        <div className="iv-grid" aria-hidden="true" />
        <div className="iv-loader">
          <span className="iv-spinner" />
          <p className="iv-loader-text">Loading interview environment…</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // ── Error State ──
  if (sessionState === 'error') {
    return (
      <div className="iv-root">
        <div className="iv-grid" aria-hidden="true" />
        <div className="iv-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="TruMatch" width={26} height={26} className="iv-logo" />
          <span className="iv-brand-text">TruMatch</span>
        </div>
        <div className="iv-card iv-error-card">
          <div className="iv-error-icon">⚠</div>
          <h2 className="iv-card-title">Interview session notice</h2>
          <p className="iv-card-sub">{errorReason || 'Unable to connect to the interview engine.'}</p>
          <button className="iv-btn-primary" onClick={() => setSessionState('intro')}>
            Return to Introduction
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // ── Completion State — Score Reveal ──
  if (sessionState === 'completed' && finalResult) {
    return (
      <div className="iv-root">
        <div className="iv-grid" aria-hidden="true" />
        <div className="iv-orb iv-orb-tl" aria-hidden="true" />
        <div className="iv-orb iv-orb-br" aria-hidden="true" />

        <div className="iv-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="TruMatch" width={26} height={26} className="iv-logo" />
          <span className="iv-brand-text">TruMatch</span>
        </div>

        <main className="iv-main">
          <div className="iv-card iv-reveal-card">
            <div className="iv-badge">
              <span className="iv-badge-dot" />
              Commitment Signal Verified
            </div>

            <h1 className="iv-reveal-title">Interview Completed</h1>
            <p className="iv-reveal-desc">
              We&rsquo;ve evaluated your GitHub technical signals alongside your interview responses. Here is your composite Commitment Score.
            </p>

            {/* Main Score Hero */}
            <div className="iv-score-hero">
              <div className="iv-score-val-wrap">
                <span className="iv-score-val">{finalResult.commitmentScore.toFixed(1)}</span>
                <span className="iv-score-max">/ 100</span>
              </div>
              <p className="iv-score-caption">Composite Commitment Score</p>
            </div>

            {/* Metric Breakdown Grid */}
            <div className="iv-metrics-grid">
              <div className="iv-metric-box">
                <span className="iv-metric-label">GitHub Consistency (70%)</span>
                <span className="iv-metric-val">{finalResult.githubScore.toFixed(1)}</span>
                <span className="iv-metric-sub">Commit cadence & repo signals</span>
              </div>
              <div className="iv-metric-box">
                <span className="iv-metric-label">Interview Specificity (30%)</span>
                <span className="iv-metric-val">{finalResult.interviewScore.toFixed(1)}</span>
                <span className="iv-metric-sub">Concrete details & transparency</span>
              </div>
              {finalResult.declaredHoursPerDay !== null && (
                <div className="iv-metric-box iv-metric-full">
                  <span className="iv-metric-label">Declared Availability</span>
                  <span className="iv-metric-val">{finalResult.declaredHoursPerDay} hrs/day</span>
                  <span className="iv-metric-sub">Self-reported daily commitment</span>
                </div>
              )}
            </div>

            {/* Flagged Discrepancies if any */}
            {finalResult.flaggedDiscrepancies && finalResult.flaggedDiscrepancies.length > 0 && (
              <div className="iv-discrepancy-section">
                <h3 className="iv-section-label">GitHub Context Observations</h3>
                <div className="iv-discrepancy-list">
                  {finalResult.flaggedDiscrepancies.map((disc, idx) => (
                    <div key={idx} className="iv-discrepancy-item">
                      <span className="iv-disc-repo">{disc.repo}</span>
                      <p className="iv-disc-issue">{disc.issue}</p>
                      <p className="iv-disc-explanation">&ldquo;{disc.userExplanation}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Communication Notes */}
            {finalResult.communicationStyleNotes && (
              <div className="iv-notes-box">
                <span className="iv-metric-label">Communication Style Notes</span>
                <p className="iv-notes-text">{finalResult.communicationStyleNotes}</p>
              </div>
            )}

            <button
              className="iv-btn-primary"
              disabled={isNavigatingToDashboard}
              onClick={() => {
                setIsNavigatingToDashboard(true);
                router.push('/dashboard');
              }}
            >
              {isNavigatingToDashboard ? (
                <span className="iv-btn-loading">
                  <span className="iv-spinner-inline" />
                  Redirecting to Dashboard...
                </span>
              ) : (
                'Go to Dashboard'
              )}
            </button>
          </div>
        </main>

        <style>{styles}</style>
      </div>
    );
  }

  // ── Intro / Ready State ──
  if (sessionState === 'intro') {
    return (
      <div className="iv-root">
        <div className="iv-grid" aria-hidden="true" />
        <div className="iv-orb iv-orb-tl" aria-hidden="true" />
        <div className="iv-orb iv-orb-br" aria-hidden="true" />

        <div className="iv-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="TruMatch" width={26} height={26} className="iv-logo" />
          <span className="iv-brand-text">TruMatch</span>
        </div>

        <main className="iv-main">
          <div className="iv-card iv-intro-card">
            <div className="iv-check-wrap">
              <svg className="iv-check" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="25" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <path d="M14 26.5L22 34.5L38 18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="iv-heading-wrap">
              <span className="iv-eyebrow">GitHub analysis verified</span>
              <h1 className="iv-title">
                Ready for your AI interview, {user?.name?.split(' ')[0] || user?.username || 'Developer'}.
              </h1>
              <p className="iv-desc">
                Our AI will ask you a few short questions about your past projects, working style, and availability. Questions stream in real-time and adapt based on your actual GitHub data.
              </p>
            </div>

            <div className="iv-info-list">
              <div className="iv-info-item">
                <span className="iv-info-dot" />
                <span>Scans both your public and private GitHub repositories</span>
              </div>
              <div className="iv-info-item">
                <span className="iv-info-dot" />
                <span>5 brief core topics + tailored follow-ups</span>
              </div>
              <div className="iv-info-item">
                <span className="iv-info-dot" />
                <span>Fact-based evaluation, no trick questions</span>
              </div>
              <div className="iv-info-item">
                <span className="iv-info-dot" />
                <span>Generates your transparent Commitment Score</span>
              </div>
            </div>

            <button className="iv-btn-primary" onClick={startInterview}>
              Start AI Interview
            </button>
          </div>
        </main>

        <style>{styles}</style>
      </div>
    );
  }

  // ── Live Interview Chat State ──
  return (
    <div className="iv-root iv-chat-layout">
      <div className="iv-grid" aria-hidden="true" />

      {/* Header */}
      <header className="iv-chat-header">
        <div className="iv-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="TruMatch" width={24} height={24} className="iv-logo" />
          <span className="iv-brand-text">TruMatch AI Interview</span>
        </div>
        <div className="iv-header-status">
          <span className={`iv-status-dot ${isDisconnected ? 'iv-status-offline' : ''}`} />
          <span>{isDisconnected ? 'Connection Lost' : 'Live Session'}</span>
        </div>
      </header>

      {/* Chat Messages Container */}
      <main className="iv-chat-body" ref={chatContainerRef}>
        <div className="iv-messages-wrapper">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`iv-msg-row ${msg.role === 'user' ? 'iv-msg-user' : 'iv-msg-ai'}`}
            >
              {msg.role === 'assistant' && (
                <div className="iv-avatar iv-avatar-ai">
                  <span>AI</span>
                </div>
              )}

              <div className="iv-msg-bubble">
                <p className="iv-msg-text">{msg.text}</p>
                {msg.isStreaming && <span className="iv-stream-cursor">|</span>}
              </div>

              {msg.role === 'user' && (
                <div className="iv-avatar iv-avatar-user">
                  <span>{user?.name?.[0] || user?.username?.[0] || 'U'}</span>
                </div>
              )}
            </div>
          ))}

          {isAiTyping && !isDisconnected && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="iv-msg-row iv-msg-ai">
              <div className="iv-avatar iv-avatar-ai">
                <span>AI</span>
              </div>
              <div className="iv-msg-bubble iv-typing-bubble">
                <span className="iv-typing-dot" />
                <span className="iv-typing-dot" />
                <span className="iv-typing-dot" />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input Bar / Reconnect Banner / Finish Button */}
      <footer className="iv-chat-footer">
        {isDisconnected ? (
          <div className="iv-disconnect-banner">
            <div className="iv-disconnect-info">
              <span className="iv-disconnect-icon" aria-hidden="true">⚠</span>
              <div>
                <p className="iv-disconnect-title">Connection lost</p>
                <p className="iv-disconnect-sub">Your session is preserved. Click Reconnect to resume where you left off.</p>
              </div>
            </div>
            <button
              className="iv-reconnect-btn"
              onClick={handleReconnect}
              disabled={isReconnecting}
            >
              {isReconnecting ? (
                <span className="iv-btn-loading">
                  <span className="iv-spinner-inline" />
                  Reconnecting...
                </span>
              ) : (
                'Reconnect'
              )}
            </button>
          </div>
        ) : isFinishedReady ? (
          <div className="iv-finished-container">
            <button
              className="iv-btn-primary iv-finish-btn"
              onClick={handleManualComplete}
              disabled={isFinishing}
            >
              {isFinishing ? (
                <span className="iv-btn-loading">
                  <span className="iv-spinner-inline" />
                  Evaluating responses & generating score...
                </span>
              ) : (
                'Complete Interview & View Score →'
              )}
            </button>
          </div>
        ) : (
          <>
            <div className="iv-input-container">
              <textarea
                ref={textareaRef}
                autoFocus
                className="iv-textarea"
                placeholder="Type your response here… (Press Enter to send)"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isAiTyping}
                rows={1}
              />
              <button
                className="iv-send-btn"
                onClick={handleSendAnswer}
                disabled={!currentAnswer.trim() || isAiTyping}
                aria-label="Send response"
              >
                <svg viewBox="0 0 24 24" fill="none" className="iv-send-icon">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="iv-footer-note">Press Shift + Enter for new lines. Answers are persisted in real-time.</p>
          </>
        )}
      </footer>

      <style>{styles}</style>
    </div>
  );
}

// ─── Scoped Styles ────────────────────────────────────────────────────────────
// DESIGN RULES:
//   • Palette: whites, greys, blacks only — NO blue, purple, yellow
//   • Font: var(--font-edu-hand) across the application
//   • Background: var(--bg-primary, #0a0a0a)
// ─────────────────────────────────────────────────────────────────────────────
const styles = `
  .iv-root {
    min-height: 100svh;
    background: linear-gradient(180deg, #05100e 0%, #070d0b 50%, #060c0a 100%);
    color: var(--text-primary, #f2f2f2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    font-family: var(--font-montserrat), Montserrat, sans-serif;
  }

  .iv-chat-layout {
    justify-content: space-between;
    height: 100svh;
  }

  /* Grid background */
  .iv-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
    background-size: 76px 76px;
    pointer-events: none;
    z-index: 0;
  }

  /* Soft grey depth orbs */
  .iv-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    opacity: 0.055;
    pointer-events: none;
    z-index: 0;
  }
  .iv-orb-tl { width: 560px; height: 560px; background: #ffffff; top: -180px; left: -160px; }
  .iv-orb-br { width: 440px; height: 440px; background: #aaaaaa; bottom: -140px; right: -120px; }

  /* Brand Header */
  .iv-brand {
    position: absolute;
    top: 1.75rem;
    left: 2rem;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    user-select: none;
    z-index: 10;
  }
  .iv-logo { display: block; opacity: 0.85; }
  .iv-brand-text {
    font-family: var(--font-montserrat), Montserrat, sans-serif;
    font-weight: 700;
    font-size: 1.05rem;
    color: var(--text-primary, #f2f2f2);
    opacity: 0.85;
  }

  /* Main Container */
  .iv-main {
    position: relative;
    z-index: 1;
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 5.5rem 1.5rem 3rem;
  }

  /* Cards — whySection background */
  .iv-card {
    background: linear-gradient(180deg, #0c0810 0%, #0b0810 50%, #0a070e 100%);
    border: 1px solid rgba(168,85,247,0.2);
    border-radius: 1.75rem;
    padding: clamp(2rem, 5vw, 3rem);
    max-width: 580px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    box-shadow: 0 16px 48px rgba(0,0,0,0.6);
  }

  .iv-intro-card { align-items: flex-start; }
  .iv-reveal-card { max-width: 640px; }

  /* Check icon */
  .iv-check-wrap { width: 48px; height: 48px; }
  .iv-check { width: 48px; height: 48px; }

  /* Headings */
  .iv-heading-wrap { display: flex; flex-direction: column; gap: 0.5rem; }
  .iv-eyebrow {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #a855f7;
  }
  .iv-title {
    font-size: clamp(1.4rem, 4vw, 2rem);
    font-weight: 700;
    line-height: 1.2;
    color: var(--text-primary, #f2f2f2);
  }
  .iv-desc {
    font-size: 0.9rem;
    color: var(--text-secondary, #a0a0a0);
    line-height: 1.6;
  }

  /* Info list */
  .iv-info-list { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }
  .iv-info-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: var(--text-secondary, #a0a0a0);
  }
  .iv-info-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #a855f7;
    opacity: 0.8;
    flex-shrink: 0;
  }

  /* Buttons — landing page button properties */
  .iv-btn-primary {
    font-family: var(--font-montserrat), Montserrat, sans-serif;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.9rem 2.25rem;
    border-radius: 12px;
    border: 1px solid rgba(168,85,247,0.35);
    background: linear-gradient(135deg, #201927 0%, #272623 100%);
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    width: 100%;
    margin-top: 0.5rem;
    box-shadow: 0 0 28px rgba(168,85,247,0.28);
    text-decoration: none;
  }
  .iv-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 48px rgba(168,85,247,0.48);
    opacity: 0.95;
  }

  /* Live Chat Header */
  .iv-chat-header {
    width: 100%;
    height: 64px;
    padding: 0 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(5, 16, 14, 0.88);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(52,211,153,0.12);
    position: relative;
    z-index: 10;
  }
  .iv-chat-header .iv-brand { position: static; }
  .iv-header-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--text-secondary, #a0a0a0);
  }
  .iv-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 8px #34d399;
  }
  .iv-status-offline {
    background: #f87171 !important;
    box-shadow: 0 0 8px #f87171 !important;
  }

  /* Disconnect banner & Reconnect button */
  .iv-disconnect-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    background: linear-gradient(180deg, #18111e 0%, #130d19 100%);
    border: 1px solid rgba(248, 113, 113, 0.35);
    border-radius: 1.25rem;
    padding: 1rem 1.25rem;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }
  .iv-disconnect-info {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }
  .iv-disconnect-icon {
    font-size: 1.25rem;
    color: #f87171;
  }
  .iv-disconnect-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary, #f2f2f2);
  }
  .iv-disconnect-sub {
    font-size: 0.8rem;
    color: var(--text-secondary, #a0a0a0);
    margin-top: 2px;
  }
  .iv-reconnect-btn {
    font-family: var(--font-montserrat), Montserrat, sans-serif;
    padding: 0.65rem 1.4rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.1);
    color: #ffffff;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  }
  .iv-reconnect-btn:hover {
    background: rgba(255,255,255,0.18);
    border-color: rgba(255,255,255,0.35);
    transform: translateY(-1px);
  }
  .iv-reconnect-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* Chat Body */
  .iv-chat-body {
    flex: 1;
    width: 100%;
    max-width: 760px;
    overflow-y: auto;
    padding: 2rem 1.5rem;
    position: relative;
    z-index: 1;
  }
  .iv-messages-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Rows & Bubbles — conversation sections match whySection background */
  .iv-msg-row {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    max-width: 85%;
  }
  .iv-msg-ai { align-self: flex-start; }
  .iv-msg-user { align-self: flex-end; flex-direction: row-reverse; }

  .iv-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }
  .iv-avatar-ai {
    background: linear-gradient(135deg, #201927 0%, #272623 100%);
    border: 1px solid rgba(168,85,247,0.3);
    color: var(--text-primary, #f2f2f2);
  }
  .iv-avatar-user {
    background: #ffffff;
    color: #000000;
  }

  .iv-msg-bubble {
    padding: 1rem 1.25rem;
    border-radius: 1.25rem;
    font-size: 0.95rem;
    line-height: 1.6;
    word-break: break-word;
  }
  .iv-msg-ai .iv-msg-bubble {
    background: linear-gradient(180deg, #0c0810 0%, #0b0810 50%, #0a070e 100%);
    border: 1px solid rgba(168,85,247,0.2);
    color: var(--text-primary, #f2f2f2);
    border-top-left-radius: 0.3rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .iv-msg-user .iv-msg-bubble {
    background: linear-gradient(135deg, #1d1427 0%, #161220 100%);
    border: 1px solid rgba(168,85,247,0.3);
    color: var(--text-primary, #f2f2f2);
    border-top-right-radius: 0.3rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }

  .iv-stream-cursor {
    display: inline-block;
    margin-left: 2px;
    animation: iv-blink 0.8s step-end infinite;
    color: #a855f7;
  }
  @keyframes iv-blink { 50% { opacity: 0; } }

  /* Typing dots */
  .iv-typing-bubble {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.85rem 1.1rem;
    background: linear-gradient(180deg, #0c0810 0%, #0b0810 50%, #0a070e 100%);
    border: 1px solid rgba(168,85,247,0.2);
  }
  .iv-typing-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #a855f7;
    animation: iv-bounce 1.4s infinite ease-in-out both;
  }
  .iv-typing-dot:nth-child(1) { animation-delay: -0.32s; }
  .iv-typing-dot:nth-child(2) { animation-delay: -0.16s; }
  @keyframes iv-bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }

  /* Chat Footer */
  .iv-chat-footer {
    width: 100%;
    max-width: 760px;
    padding: 1rem 1.5rem 1.5rem;
    position: relative;
    z-index: 10;
  }
  .iv-input-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: linear-gradient(180deg, #0c0810 0%, #0b0810 100%);
    border: 1px solid rgba(168,85,247,0.25);
    border-radius: 1.25rem;
    padding: 0.6rem 0.85rem 0.6rem 1.1rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .iv-input-container:focus-within {
    border-color: rgba(168,85,247,0.6);
    box-shadow: 0 0 24px rgba(168,85,247,0.3);
  }
  .iv-textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary, #f2f2f2);
    font-family: var(--font-montserrat), Montserrat, sans-serif;
    font-size: 0.95rem;
    resize: none;
    max-height: 120px;
  }
  .iv-send-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #201927 0%, #272623 100%);
    border: 1px solid rgba(168,85,247,0.35);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    flex-shrink: 0;
  }
  .iv-send-btn:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 16px rgba(168,85,247,0.4);
  }
  .iv-send-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }
  .iv-send-icon { width: 18px; height: 18px; }
  .iv-footer-note {
    font-size: 0.72rem;
    color: var(--text-muted, #525252);
    text-align: center;
    margin-top: 0.5rem;
  }

  /* Score Reveal Section */
  .iv-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0.35rem 0.75rem;
    border-radius: 2rem;
    background: rgba(168,85,247,0.1);
    border: 1px solid rgba(168,85,247,0.22);
    color: #c084fc;
  }
  .iv-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #34d399; boxShadow: 0 0 6px #34d399; }

  .iv-reveal-title { font-size: 1.85rem; font-weight: 700; color: #ffffff; }
  .iv-reveal-desc { font-size: 0.9rem; color: var(--text-secondary, #a0a0a0); line-height: 1.6; }

  .iv-score-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    background: linear-gradient(180deg, #140d1c 0%, #0f0a17 100%);
    border: 1px solid rgba(168,85,247,0.25);
    border-radius: 1.25rem;
    margin: 0.5rem 0;
  }
  .iv-score-val-wrap { display: flex; align-items: baseline; gap: 0.4rem; }
  .iv-score-val { font-size: 3.5rem; font-weight: 800; color: #ffffff; letter-spacing: -0.04em; }
  .iv-score-max { font-size: 1.1rem; color: var(--text-muted, #525252); }
  .iv-score-caption { font-size: 0.85rem; color: var(--text-secondary, #a0a0a0); margin-top: 0.25rem; }

  .iv-metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    width: 100%;
  }
  @media (max-width: 640px) {
    .iv-metrics-grid {
      grid-template-columns: 1fr;
    }
    .iv-metric-full {
      grid-column: span 1 !important;
    }
    .iv-card {
      padding: 1.25rem 1rem !important;
    }
    .iv-chat-footer {
      padding: 0.75rem 1rem 1rem !important;
    }
  }
  .iv-metric-box {
    background: linear-gradient(180deg, #0e0914 0%, #0c0812 100%);
    border: 1px solid rgba(168,85,247,0.18);
    border-radius: 1rem;
    padding: 1.1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .iv-metric-full { grid-column: span 2; }
  .iv-metric-label { font-size: 0.78rem; color: var(--text-muted, #888); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .iv-metric-val { font-size: 1.35rem; font-weight: 700; color: #ffffff; }
  .iv-metric-sub { font-size: 0.78rem; color: var(--text-secondary, #a0a0a0); }

  .iv-discrepancy-section { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }
  .iv-section-label { font-size: 0.85rem; font-weight: 700; color: var(--text-primary, #f2f2f2); }
  .iv-discrepancy-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .iv-discrepancy-item {
    background: linear-gradient(180deg, #0e0914 0%, #0c0812 100%);
    border: 1px solid rgba(168,85,247,0.18);
    border-radius: 0.875rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .iv-disc-repo { font-size: 0.8rem; font-weight: 700; color: #ffffff; }
  .iv-disc-issue { font-size: 0.825rem; color: var(--text-secondary, #a0a0a0); }
  .iv-disc-explanation { font-size: 0.825rem; color: var(--text-muted, #888888); font-style: italic; }

  .iv-notes-box {
    background: linear-gradient(180deg, #0e0914 0%, #0c0812 100%);
    border: 1px solid rgba(168,85,247,0.18);
    border-radius: 1rem;
    padding: 1.1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
  }
  .iv-notes-text { font-size: 0.875rem; color: var(--text-secondary, #a0a0a0); line-height: 1.55; }

  .iv-loader { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  .iv-spinner {
    width: 24px; height: 24px;
    border: 2px solid rgba(255,255,255,0.1);
    border-top-color: #34d399;
    border-radius: 50%;
    animation: iv-spin 0.8s linear infinite;
  }
  @keyframes iv-spin { to { transform: rotate(360deg); } }
  .iv-loader-text { font-size: 0.9rem; color: var(--text-secondary, #a0a0a0); }

  .iv-btn-loading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
  }
  .iv-spinner-inline {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.25);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: iv-spin 0.8s linear infinite;
    display: inline-block;
    flex-shrink: 0;
  }
  .iv-finished-container {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .iv-finish-btn {
    width: 100%;
    margin-top: 0;
  }
`;

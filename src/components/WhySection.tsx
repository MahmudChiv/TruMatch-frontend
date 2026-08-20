'use client';

import { useEffect, useRef, useState } from 'react';
import HowItWorks, { Step } from '@/components/ui/how-it-works';

const FONT = "var(--font-montserrat), Montserrat, sans-serif";

/* ── Intersection observer hook for scroll-triggered reveal ── */
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

/* ── Staggered reveal wrapper ── */
function Reveal({
  children,
  delay = 0,
  direction = 'up',
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
}) {
  const { ref, inView } = useInView();
  const translateMap = { up: 'translateY(32px)', left: 'translateX(-32px)', right: 'translateX(32px)' };

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : translateMap[direction],
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────── */

const PAIN_POINTS = [
  {
    icon: '⚡',
    title: 'Over-commitment at sign-up',
    body: 'Developers enthusiastically join teams, claim full availability, then disappear once real work starts.',
  },
  {
    icon: '🔇',
    title: 'No signal before you commit',
    body: 'There\'s zero reliable data on a stranger\'s follow-through before you lock them into your team for a 48-hour sprint or get them hired to your company.',
  },
  {
    icon: '💀',
    title: 'Projects die mid-execution',
    body: 'One dropout cascades into scope collapse. Remaining members burn out covering gaps nobody saw coming.',
  },
  {
    icon: '♻️',
    title: 'The cycle repeats',
    body: 'Organisers can\'t prevent it. Veterans start avoiding hackathons, hiring managers just have to believe random CVs, startups run into problems. New devs get a terrible first impression.',
  },
];

const HOW_STEPS: Step[] = [
  {
    title: 'GitHub as ground truth',
    description: 'We pull your real activity — commit streaks, PR completion rates, issue close ratios — and convert them into numeric commitment signals. No vibes, no self-reporting.',
    colorTheme: 'emerald',
  },
  {
    title: 'AI interview with context',
    description: 'Gemini reads your GitHub data and asks questions tailored to your patterns. If your streak shows late-night pushes before deadlines, we ask about that. Context-aware, not generic.',
    colorTheme: 'indigo',
  },
  {
    title: 'A transparent Commitment Score',
    description: 'Every sub-score is visible: consistency, PR velocity, issue follow-through. You see exactly how your score was calculated — no black box.',
    colorTheme: 'purple',
  },
  {
    title: 'Matched by commitment level',
    description: 'High-scorers get paired with high-scorers. Casual participants find like-minded teams. Expectations align before the clock starts.',
    colorTheme: 'emerald',
  },
  {
    title: 'AI-generated Team Charter',
    description: 'Before work starts, our AI drafts a custom charter: working hours, decision rights, scope limits, drop-out protocol. Everyone signs. Expectations are explicit.',
    colorTheme: 'indigo',
  },
  {
    title: 'Peer ratings close the loop',
    description: 'And yes! The best part... After the project, teammates rate each other. Ratings feed back into the Commitment Score. Consistent delivery gets rewarded over time.',
    colorTheme: 'purple',
  },
];

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '99px',
        padding: '5px 16px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#8a8a8a',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontFamily: FONT,
      }}
    >
      {children}
    </div>
  );
}

function PainCard({
  icon,
  title,
  body,
  index,
}: {
  icon: string;
  title: string;
  body: string;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Reveal delay={index * 0.1} direction="up">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          border: hovered ? '1px solid rgba(255,255,255,0.13)' : '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '28px',
          transition: 'background 0.25s, border-color 0.25s, transform 0.25s',
          transform: hovered ? 'translateY(-3px)' : 'none',
          cursor: 'default',
        }}
      >
        <div style={{ fontSize: '1.6rem', marginBottom: '14px', lineHeight: 1 }}>{icon}</div>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#e8e8e8',
            marginBottom: '10px',
            fontFamily: FONT,
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '0.9rem',
            color: '#6a6a6a',
            lineHeight: 1.7,
            fontFamily: FONT,
          }}
        >
          {body}
        </p>
      </div>
    </Reveal>
  );
}

/* ─────────────────────────────────────────────────────────────
   STAT STRIP
───────────────────────────────────────────────────────────── */
function StatStrip() {
  const { ref, inView } = useInView(0.2);
  const stats = [
    { value: '67%', label: 'of hackathon teams lose a member mid-project' },
    { value: 'Startups', label: 'Over 65% of high potential startups fail due to conflict among co-founders' },
    { value: '3×', label: 'more likely to ship if commitment levels match' },
    { value: '0', label: 'self-reported data used in TruMatch scoring' },
  ];

  return (
    <div
      ref={ref}
      className="stat-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {stats.map((s, i) => (
        <div
          key={i}
          style={{
            background: '#0f0f0f',
            padding: '36px 28px',
            textAlign: 'center',
            opacity: inView ? 1 : 0,
            transform: inView ? 'none' : 'translateY(20px)',
            transition: `opacity 0.6s ease ${i * 0.12}s, transform 0.6s ease ${i * 0.12}s`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#f2f2f2',
              lineHeight: 1,
              marginBottom: '10px',
              fontFamily: FONT,
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              fontSize: '0.82rem',
              color: '#585858',
              lineHeight: 1.55,
              maxWidth: '180px',
              margin: '0 auto',
              fontFamily: FONT,
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DIVIDER
───────────────────────────────────────────────────────────── */
function HR() {
  return (
    <div
      style={{
        width: '100%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
        margin: '0 auto',
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────── */
export default function WhySection() {
  return (
    <section
      id="why-trumatch"
      style={{
        width: '100%',
        overflow: 'hidden',
        background: '#000000',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '100px 0',
        fontFamily: FONT,
      }}
    >
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '90px',
      }}>
        <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 900px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .pain-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 580px) {
          .stat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

        {/* ── BLOCK 1: The Problem ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '44px', width: '100%', alignItems: 'center' }}>
          <Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', textAlign: 'center', alignItems: 'center' }}>
              <SectionLabel>The Problem</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(1.9rem, 4vw, 3rem)',
                  fontWeight: 700,
                  color: '#f2f2f2',
                  lineHeight: 1.18,
                  letterSpacing: '-0.01em',
                  fontFamily: FONT,
                }}
              >
                Hackathon | Startup teams fail before<br />
                <span style={{ color: '#666666' }}>the first commit lands.</span>
              </h2>
              <p
                style={{
                  fontSize: '1.02rem',
                  color: '#888888',
                  lineHeight: 1.8,
                  maxWidth: '680px',
                  fontFamily: FONT,
                }}
              >
                Team formation in hackathons runs entirely on vibes, optimism, and LinkedIn
                bios. There&apos;s no mechanism to verify whether someone&apos;s claimed availability
                matches their actual behaviour — until it&apos;s too late and half your team
                has gone silent at 2 AM.
              </p>
            </div>
          </Reveal>

          {/* Pain point cards */}
          <div
            className="pain-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
              width: '100%',
            }}
          >
            {PAIN_POINTS.map((p, i) => (
              <PainCard key={i} {...p} index={i} />
            ))}
          </div>
        </div>

        <HR />

        {/* ── BLOCK 2: Stats ── */}
        <Reveal>
          <StatStrip />
        </Reveal>

        <HR />

        {/* ── BLOCK 3: The Solution ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '56px', width: '100%', alignItems: 'center' }}>
          <Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', textAlign: 'center', alignItems: 'center' }}>
              <SectionLabel>How TruMatch Fixes It</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(1.9rem, 4vw, 3rem)',
                  fontWeight: 700,
                  color: '#f2f2f2',
                  lineHeight: 1.18,
                  letterSpacing: '-0.01em',
                  fontFamily: FONT,
                }}
              >
                Commitment verified by actions,<br />
                <span style={{ color: '#666666' }}>not promises.</span>
              </h2>
              <p
                style={{
                  fontSize: '1.02rem',
                  color: '#888888',
                  lineHeight: 1.8,
                  maxWidth: '680px',
                  fontFamily: FONT,
                }}
              >
                TruMatch replaces self-reported availability with a verifiable, multi-signal
                Commitment Score built from your GitHub record — then uses AI to turn that
                data into a meaningful, contextual picture of how you actually behave when
                deadlines approach.
              </p>
            </div>
          </Reveal>

          {/* Steps — pinned card board design */}
          <HowItWorks features={HOW_STEPS} />
        </div>

        <HR />

        {/* ── BLOCK 4: The contrast quote ── */}
        <Reveal direction="up">
          <div
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '24px',
              padding: '52px 48px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Large quote mark background */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '-20px',
                left: '32px',
                fontSize: '12rem',
                fontWeight: 900,
                color: 'rgba(255,255,255,0.025)',
                lineHeight: 1,
                pointerEvents: 'none',
                fontFamily: 'Georgia, serif',
                userSelect: 'none',
              }}
            >
              "
            </div>

            <blockquote
              style={{
                fontSize: 'clamp(1.15rem, 2.5vw, 1.55rem)',
                fontWeight: 600,
                color: '#c8c8c8',
                lineHeight: 1.55,
                maxWidth: '740px',
                position: 'relative',
                fontFamily: FONT,
              }}
            >
              The best teammates aren&apos;t the most talented — they&apos;re the ones who show up
              consistently when it counts. TruMatch makes that visible before you commit
              to building together.
            </blockquote>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#888',
                  fontFamily: FONT,
                }}
              >
                TM
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#888', fontFamily: FONT }}>
                  TruMatch Team
                </div>
                <div style={{ fontSize: '0.75rem', color: '#444', fontFamily: FONT }}>
                  Why we built this
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

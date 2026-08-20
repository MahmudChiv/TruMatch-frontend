"use client";

import React from "react";
import { LazyMotion, domAnimation, m } from "motion/react";

export interface Step {
  title: string;
  description: string;
  colorTheme?: "emerald" | "indigo" | "purple" | "orange" | "blue";
  colors?: {
    bg: string;
    text: string;
    border: string;
  };
}

export interface StepPosition {
  className?: string;
  rotate?: string;
}

export interface HowItWorksProps {
  features?: Step[];
  className?: string;
  stepPositions?: StepPosition[];
}

interface CardProps {
  number: string;
  title: string;
  description: string;
  colorTheme?: "emerald" | "indigo" | "purple" | "orange" | "blue";
  className?: string;
  rotate?: string;
  colors?: {
    bg: string;
    text: string;
    border: string;
  };
}

const Pin = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M16 3a1 1 0 0 1 .117 1.993l-.117 .007v4.764l1.894 3.789a1 1 0 0 1 .1 .331l.006 .116v2a1 1 0 0 1 -.883 .993l-.117 .007h-4v4a1 1 0 0 1 -1.993 .117l-.007 -.117v-4h-4a1 1 0 0 1 -.993 -.883l-.007 -.117v-2a1 1 0 0 1 .06 -.34l.046 -.107l1.894 -3.791v-4.762a1 1 0 0 1 -.117 -1.993l.117 -.007h8z" />
  </svg>
);

/* ── Mobile card: straight, full-width, no rotation ── */
const MobileCard = ({
  number,
  title,
  description,
  colorTheme = "emerald",
  colors: customColors,
}: Omit<CardProps, "className" | "rotate">) => {
  const defaultBgColors = {
    emerald: "bg-[rgba(52,211,153,0.08)] group-hover:bg-[rgba(52,211,153,0.14)]",
    orange: "bg-[rgba(52,211,153,0.08)] group-hover:bg-[rgba(52,211,153,0.14)]",
    indigo: "bg-[rgba(129,140,248,0.08)] group-hover:bg-[rgba(129,140,248,0.14)]",
    blue: "bg-[rgba(129,140,248,0.08)] group-hover:bg-[rgba(129,140,248,0.14)]",
    purple: "bg-[rgba(168,85,247,0.08)] group-hover:bg-[rgba(168,85,247,0.14)]",
  };
  const defaultTextColors = {
    emerald: "text-emerald-400",
    orange: "text-emerald-400",
    indigo: "text-indigo-400",
    blue: "text-indigo-400",
    purple: "text-purple-400",
  };
  const defaultBorderColors = {
    emerald: "border-[rgba(52,211,153,0.28)]",
    orange: "border-[rgba(52,211,153,0.28)]",
    indigo: "border-[rgba(129,140,248,0.28)]",
    blue: "border-[rgba(129,140,248,0.28)]",
    purple: "border-[rgba(168,85,247,0.28)]",
  };

  const bgColor = customColors?.bg || defaultBgColors[colorTheme] || defaultBgColors.emerald;
  const textColor = customColors?.text || defaultTextColors[colorTheme] || defaultTextColors.emerald;
  const borderColor = customColors?.border || defaultBorderColors[colorTheme] || defaultBorderColors.emerald;

  return (
    <div className="w-full flex flex-col items-center gap-0">
      {/* Centered pin above the card */}
      <Pin className={`w-8 h-8 ${textColor} mb-[-1px] z-10 relative`} />
      {/* Card body */}
      <div className="bg-[#141414] p-2.5 rounded-[26px] w-full border border-neutral-800/90 shadow-[0px_8px_24px_rgba(0,0,0,0.7)] transition-shadow duration-300 group-hover:shadow-[0px_16px_40px_rgba(0,0,0,0.9)]">
        <div
          className={`${bgColor} border ${borderColor} rounded-[20px] w-full transition-colors duration-300`}
          style={{ padding: "28px 24px" }}
        >
          <span
            className={`${textColor} text-3xl font-bold mb-3 block select-none tracking-tight`}
            style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}
          >
            {number}
          </span>
          <h3
            className="text-lg font-bold text-white leading-snug mb-2 tracking-normal"
            style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}
          >
            {title}
          </h3>
          <p
            className="text-neutral-400 text-[0.9rem] leading-[1.7] font-normal"
            style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

const Card = ({
  number,
  title,
  description,
  colorTheme = "emerald",
  className = "",
  rotate = "",
  colors: customColors,
}: CardProps) => {
  const defaultBgColors = {
    emerald: "bg-[rgba(52,211,153,0.08)] group-hover:bg-[rgba(52,211,153,0.14)]",
    orange: "bg-[rgba(52,211,153,0.08)] group-hover:bg-[rgba(52,211,153,0.14)]",
    indigo: "bg-[rgba(129,140,248,0.08)] group-hover:bg-[rgba(129,140,248,0.14)]",
    blue: "bg-[rgba(129,140,248,0.08)] group-hover:bg-[rgba(129,140,248,0.14)]",
    purple: "bg-[rgba(168,85,247,0.08)] group-hover:bg-[rgba(168,85,247,0.14)]",
  };
  const defaultTextColors = {
    emerald: "text-emerald-400 group-hover:text-emerald-300",
    orange: "text-emerald-400 group-hover:text-emerald-300",
    indigo: "text-indigo-400 group-hover:text-indigo-300",
    blue: "text-indigo-400 group-hover:text-indigo-300",
    purple: "text-purple-400 group-hover:text-purple-300",
  };
  const defaultBorderColors = {
    emerald: "border-[rgba(52,211,153,0.22)] group-hover:border-[rgba(52,211,153,0.55)]",
    orange: "border-[rgba(52,211,153,0.22)] group-hover:border-[rgba(52,211,153,0.55)]",
    indigo: "border-[rgba(129,140,248,0.22)] group-hover:border-[rgba(129,140,248,0.55)]",
    blue: "border-[rgba(129,140,248,0.22)] group-hover:border-[rgba(129,140,248,0.55)]",
    purple: "border-[rgba(168,85,247,0.22)] group-hover:border-[rgba(168,85,247,0.55)]",
  };

  const bgColor = customColors?.bg || defaultBgColors[colorTheme] || defaultBgColors.emerald;
  const textColor = customColors?.text || defaultTextColors[colorTheme] || defaultTextColors.emerald;
  const borderColor = customColors?.border || defaultBorderColors[colorTheme] || defaultBorderColors.emerald;

  return (
    <m.div
      whileHover={{
        scale: 1.08,
        rotate: 0,
        y: -10,
        zIndex: 50,
      }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      className={`group relative w-full md:w-[380px] cursor-pointer ${rotate} ${className}`}
    >
      {/* Outer card shell */}
      <div className="bg-[#141414] p-3 rounded-[30px] shadow-[0px_10px_30px_0px_rgba(0,0,0,0.85)] group-hover:shadow-[0px_25px_60px_0px_rgba(0,0,0,0.98)] border border-neutral-800/90 group-hover:border-neutral-500 transition-colors duration-300">
        <Pin className={`w-8 h-8 ${textColor} z-20 mt-2 mb-5 mx-auto transition-transform duration-300 group-hover:scale-115`} />
        {/* Inner colored box — explicit inline padding guarantees spacing regardless of Tailwind class generation */}
        <div
          className={`${bgColor} border ${borderColor} rounded-[22px] flex flex-col relative transition-colors duration-300 overflow-hidden`}
          style={{ padding: "32px" }}
        >
          <span
            className={`${textColor} text-4xl font-bold mb-4 select-none tracking-tight transition-colors duration-300`}
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            }}
          >
            {number}
          </span>
          <h3
            className="text-xl font-bold text-white group-hover:text-white leading-snug mb-3 tracking-normal transition-colors duration-300"
            style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}
          >
            {title}
          </h3>
          <p
            className="text-neutral-300 group-hover:text-white text-[0.93rem] leading-[1.65] tracking-normal transition-colors duration-300 font-normal break-words"
            style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}
          >
            {description}
          </p>
        </div>
      </div>
    </m.div>
  );
};

const DEFAULT_CARD_POSITIONS: StepPosition[] = [
  { className: "md:absolute md:top-0 md:left-[3%]", rotate: "rotate-6" },
  {
    className: "md:absolute md:top-[220px] md:right-[3%]",
    rotate: "-rotate-6",
  },
  { className: "md:absolute md:top-[640px] md:left-[3%]", rotate: "rotate-6" },
  {
    className: "md:absolute md:top-[860px] md:right-[3%]",
    rotate: "-rotate-6",
  },
  { className: "md:absolute md:top-[1280px] md:left-[3%]", rotate: "rotate-6" },
  {
    className: "md:absolute md:top-[1500px] md:right-[3%]",
    rotate: "-rotate-6",
  },
];

export default function HowItWorks({
  features,
  className = "",
  stepPositions,
}: HowItWorksProps) {
  const defaultFeatures: Step[] = [
    {
      title: "Create Account",
      description:
        "Sign up in minutes. Enter your details and verify your email to get started.",
      colorTheme: "emerald",
    },
    {
      title: "Verify Identity",
      description:
        "Complete your profile verification to ensure secure transactions and compliance.",
      colorTheme: "indigo",
    },
    {
      title: "Select Plan",
      description:
        "Choose from a variety of investment plans tailored to your financial goals.",
      colorTheme: "purple",
    },
    {
      title: "Analyze & Invest",
      description:
        "Review returns and make your first investment with confidence.",
      colorTheme: "emerald",
    },
    {
      title: "Track Growth",
      description:
        "Monitor your portfolio in real-time and watch your wealth grow over time.",
      colorTheme: "indigo",
    },
  ];

  const data = features && features.length > 0 ? features : defaultFeatures;
  const positions = stepPositions || DEFAULT_CARD_POSITIONS;

  let height = 1130;
  if (data.length === 1) height = 400;
  else if (data.length === 2) height = 540;
  else if (data.length === 3) height = 980;
  else if (data.length === 4) height = 1200;
  else if (data.length === 5) height = 1620;
  else height = 1900;

  return (
    <LazyMotion features={domAnimation}>
      {/* ── MOBILE / TABLET: straight stacked cards (< md) ── */}
      <div className="md:hidden w-full px-5 py-8 flex flex-col gap-6">
        {data.map((step, index) => (
          <m.div
            key={step.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: index * 0.07 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="group w-full cursor-pointer"
          >
            <MobileCard
              number={`0${index + 1}`}
              title={step.title}
              description={step.description}
              colorTheme={step.colorTheme || "emerald"}
              colors={step.colors}
            />
          </m.div>
        ))}
      </div>

      {/* ── DESKTOP: angled pinned-card board (≥ md) ── */}
      <div
        className={`hidden md:block bg-transparent md:py-16 px-8 relative w-full ${className}`}
      >
        <div className="max-w-6xl mx-auto relative z-10">
          <div
            className="relative w-full max-w-[1000px] mx-auto h-[var(--md-height)]"
            style={{ "--md-height": `${height}px` } as React.CSSProperties}
          >
            {data.length > 1 && (
              <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
                viewBox={`0 0 1000 ${height}`}
                preserveAspectRatio="none"
              >
                {(() => {
                  const pathD = data.reduce((acc, _, index) => {
                    if (index >= data.length - 1) return acc;
                    if (index === 0)
                      return "M 380 200 C 500 200, 500 380, 620 380";
                    if (index === 1)
                      return acc + " C 800 380, 500 620, 380 820";
                    if (index === 2)
                      return acc + " C 380 820, 500 820, 620 1040";
                    if (index === 3)
                      return acc + " C 800 1040, 500 1260, 380 1460";
                    if (index === 4)
                      return acc + " C 380 1460, 500 1460, 620 1680";
                    return acc;
                  }, "");
                  return (
                    <m.path
                      d={pathD}
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth="2"
                      strokeDasharray="8 6"
                      fill="none"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      initial={{ strokeDashoffset: 0 }}
                      animate={{ strokeDashoffset: -140 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  );
                })()}
              </svg>
            )}

            {data.map((step, index) => {
              const position = positions[index % positions.length];
              return (
                <Card
                  key={step.title}
                  number={`0${index + 1}`}
                  title={step.title}
                  description={step.description}
                  colorTheme={step.colorTheme || "emerald"}
                  colors={step.colors}
                  rotate={position.rotate}
                  className={position.className}
                />
              );
            })}
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}

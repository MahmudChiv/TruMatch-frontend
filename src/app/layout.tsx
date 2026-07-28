import type { Metadata } from "next";
import { Geist, Geist_Mono, Edu_VIC_WA_NT_Hand } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const eduHand = Edu_VIC_WA_NT_Hand({
  variable: "--font-edu-hand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TruMatch — Find Teammates Who Actually Deliver",
  description:
    "TruMatch uses AI-verified GitHub commitment scores to match hackathon developers by follow-through, not just skills. Stop getting ghosted mid-project.",
  keywords: ["hackathon", "developer matching", "commitment score", "team formation", "GitHub"],
  openGraph: {
    title: "TruMatch — Find Teammates Who Actually Deliver",
    description:
      "AI-powered developer commitment verification for hackathons and short-term projects.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${eduHand.variable}`}
    >
      <body style={{ fontFamily: "var(--font-edu-hand), cursive", wordSpacing: "0.18em" }}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TruMatch — Find Teammates Who Actually Deliver",
  description:
    "TruMatch uses AI-verified GitHub commitment scores to match hackathon developers by follow-through, not just skills. Stop getting ghosted mid-project.",
  keywords: ["hackathon", "developer matching", "commitment score", "team formation", "GitHub"],
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "TruMatch — Find Teammates Who Actually Deliver",
    description:
      "AI-powered developer commitment verification for hackathons and short-term projects.",
    type: "website",
  },
};

import ThemeProvider from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={montserrat.variable}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('trumatch_theme');
                if (saved === 'light' || saved === 'dark') {
                  document.documentElement.setAttribute('data-theme', saved);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "365step — one year, 365 steps, one big goal",
    template: "%s · 365step",
  },
  description:
    "365step turns a big educational goal into small daily actions. Set a goal, get a personalised roadmap, complete short daily steps, and find the opportunities that actually match you.",
  applicationName: "365step",
  keywords: [
    "education",
    "roadmap",
    "SAT",
    "IELTS",
    "research",
    "scholarships",
    "olympiads",
    "internships",
    "study plan",
  ],
  openGraph: {
    title: "365step — one year, 365 steps, one big goal",
    description: "Turn your ambitions into small daily actions.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f9f6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="light">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

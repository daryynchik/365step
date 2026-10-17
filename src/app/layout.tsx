import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";

import "./globals.css";

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "365step — SAT, семинар и арена с друзьями",
    template: "%s · 365step",
  },
  description:
    "Подготовка к SAT по официальной структуре College Board, годовой курс чтения и письма в духе AP Seminar и арена, где очки за учёбу превращаются в снаряжение.",
  applicationName: "365step",
  icons: { icon: "/brand/step-mark.png", apple: "/brand/step-mark.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f5f2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={onest.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

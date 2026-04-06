import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Obvis – AI Medical Intelligence",
  description: "Upload medical reports, get instant AI analysis. Smart insights, precautions, and symptom chat – all in one place.",
};

import { CustomCursor } from "@/components/cursor";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased cursor-none`}
    >
      <body className="min-h-full flex flex-col bg-[#020617]">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}

// CONCEPT: next/font/google loads Google Fonts at build time,
// so there's no flash of unstyled text and no external network
// request from the browser at runtime.
//
// Neonderthaw is used exclusively for the "Synapse" logo/wordmark —
// it gives the brand a distinctive, elegant feel. Inter is the body
// font, clean and highly readable like Apple's San Francisco.
import type { Metadata } from "next";
import { Neonderthaw, Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/provider";

const neonderthaw = Neonderthaw({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-synapse",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Synapse — MCAT Prep & Pre-Med Tracker",
  description:
    "MCAT preparation and pre-med application tracking platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${neonderthaw.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}

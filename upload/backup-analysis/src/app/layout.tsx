import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AfriSpine — The Cross-Border Payments Spine for Africa",
  other: {
    'Content-Security-Policy': "frame-ancestors 'self' https://z.ai https://*.space-z.ai",
  },
  description:
    "The neutral, non-custodial payments backbone connecting the African diaspora to family back home. One Family, One Tap. Smart matching, instant delivery, and zero balance sheet risk.",
  keywords: [
    "AfriSpine",
    "cross-border payments",
    "Africa",
    "diaspora",
    "fintech",
    "payments infrastructure",
    "stablecoin",
    "AI matching",
    "cross-border",
    "mobile money",
  ],
  icons: {
    icon: [
      { url: "/afrispine-favicon.jpg", sizes: "32x32" },
    ],
    apple: "/afrispine-favicon.jpg",
  },
  openGraph: {
    title: "AfriSpine — Spine for Africa",
    description:
      "The non-custodial payments spine connecting the African diaspora to family back home. 1-3% fees. Instant delivery. Zero custody.",
    type: "website",
    images: [{ url: "/afrispine-logo.jpg", width: 624, height: 624 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `for(const b of document.querySelectorAll('[fdprocessedid]'))b.removeAttribute('fdprocessedid');`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <ShadcnToaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
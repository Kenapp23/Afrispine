import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AfriSpine — African Creator Content Marketplace",
  description:
    "Discover and unlock premium content from Africa's top creators. Pay with M-Pesa. Support African talent directly.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "AfriSpine — African Creator Content Marketplace",
    description: "Discover and unlock premium content from Africa's top creators. Pay with M-Pesa. Support African talent directly.",
    siteName: "AfriSpine",
    type: "website",
    locale: "en_US",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://www.afri-spine.com"),
  keywords: ["AfriSpine", "African creators", "content marketplace", "M-Pesa", "African content", "premium content", "creator economy", "Kenya", "Nigeria", "Ghana"],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AfriSpine",
  alternateName: "AfriSpine — African Creator Content Marketplace",
  url: process.env.NEXT_PUBLIC_BASE_URL || "https://www.afri-spine.com",
  description: "Discover and unlock premium content from Africa's top creators. Pay with M-Pesa. Support African talent directly.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.afri-spine.com"}/#?q={search_term_string}`,
    "query-input": "required name=search_term_string",
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
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
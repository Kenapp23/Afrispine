import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AfriSpine - The Future of African Finance",
  description: "Unify payments, wealth management, and market data across Africa's leading fintech providers — all through one powerful API platform.",
  keywords: ["AfriSpine", "fintech", "Africa", "payments", "API", "wealth management", "Flutterwave", "Fincra", "MyStocks", "mobile money", "cross-border payments"],
  authors: [{ name: "AfriSpine Team" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>",
  },
  openGraph: {
    title: "AfriSpine - The Future of African Finance",
    description: "Unify payments, wealth management, and market data across Africa's leading fintech providers — one powerful API platform.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AfriSpine - The Future of African Finance",
    description: "Unify payments, wealth management, and market data across Africa's leading fintech providers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

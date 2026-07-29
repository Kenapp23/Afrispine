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
  title: "AfriSpine - Invest in Africa From Anywhere",
  description: "Built for the African diaspora. Trade stocks on NSE, NGX, and JSE exchanges. Send money home with Fincra. Invest, remit, and grow your wealth across Africa from one platform.",
  keywords: ["AfriSpine", "African diaspora", "African stocks", "NSE", "NGX", "JSE", "fintech", "remittances", "Africa", "wealth management", "MyStocks", "Fincra"],
  authors: [{ name: "AfriSpine Team" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>",
  },
  openGraph: {
    title: "AfriSpine - Invest in Africa From Anywhere",
    description: "Built for the African diaspora. Trade stocks, send money home, and grow your wealth across Africa.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AfriSpine - Invest in Africa From Anywhere",
    description: "Built for the African diaspora. Trade stocks, send money home, and grow your wealth across Africa.",
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

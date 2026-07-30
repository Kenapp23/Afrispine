import { NextResponse } from "next/server";

export async function GET() {
  const corridors = [
    { id: "1", source: "US", destination: "KE", currency: "USD→KES", avgFee: 1.8, volume: 4_200_000, speed: "instant", flag: "🇺🇸→🇰🇪", fxRate: 153.5 },
    { id: "2", source: "US", destination: "NG", currency: "USD→NGN", avgFee: 2.1, volume: 8_900_000, speed: "< 2min", flag: "🇺🇸→🇳🇬", fxRate: 1580 },
    { id: "3", source: "UK", destination: "KE", currency: "GBP→KES", avgFee: 1.5, volume: 2_100_000, speed: "instant", flag: "🇬🇧→🇰🇪", fxRate: 194.2 },
    { id: "4", source: "UK", destination: "NG", currency: "GBP→NGN", avgFee: 1.9, volume: 3_400_000, speed: "< 5min", flag: "🇬🇧→🇳🇬", fxRate: 2005 },
    { id: "5", source: "EU", destination: "GH", currency: "EUR→GHS", avgFee: 1.6, volume: 1_800_000, speed: "instant", flag: "🇪🇺→🇬🇭", fxRate: 16.2 },
    { id: "6", source: "US", destination: "GH", currency: "USD→GHS", avgFee: 1.7, volume: 1_500_000, speed: "< 2min", flag: "🇺🇸→🇬🇭", fxRate: 15.1 },
    { id: "7", source: "US", destination: "ET", currency: "USD→ETB", avgFee: 2.3, volume: 900_000, speed: "< 5min", flag: "🇺🇸→🇪🇹", fxRate: 57.3 },
    { id: "8", source: "UK", destination: "GH", currency: "GBP→GHS", avgFee: 1.4, volume: 1_100_000, speed: "instant", flag: "🇬🇧→🇬🇭", fxRate: 20.4 },
  ];

  const participants = [
    { id: "p1", name: "Safaricom M-Pesa", type: "mno", country: "KE", volume: 12_500_000, status: "active" },
    { id: "p2", name: "MTN MoMo", type: "mno", country: "NG", volume: 8_200_000, status: "active" },
    { id: "p3", name: "Airtel Money", type: "mno", country: "GH", volume: 3_100_000, status: "active" },
    { id: "p4", name: "CBK Kenya", type: "bank", country: "KE", volume: 5_400_000, status: "active" },
    { id: "p5", name: "Access Bank NG", type: "bank", country: "NG", volume: 7_800_000, status: "active" },
    { id: "p6", name: "GCB Bank", type: "bank", country: "GH", volume: 2_100_000, status: "active" },
    { id: "p7", name: "Circle USDC Pool", type: "stablecoin_lp", country: "US", volume: 18_000_000, status: "active" },
    { id: "p8", name: "Chipper Cash", type: "fintech", country: "NG", volume: 4_600_000, status: "active" },
    { id: "p9", name: "Flutterwave", type: "fintech", country: "NG", volume: 6_200_000, status: "active" },
    { id: "p10", name: "Telebirr", type: "mno", country: "ET", volume: 1_800_000, status: "active" },
  ];

  const recentTx = [
    { id: "TX-A7F2", flag: "🇺🇸→🇰🇪", sender: "Amara J.", sendAmount: 250, recvAmount: 38275, fee: 4.5, speed: "instant", matchType: "ai_netting" },
    { id: "TX-B3D1", flag: "🇬🇧→🇳🇬", sender: "Kwame O.", sendAmount: 500, recvAmount: 997500, fee: 8.5, speed: "< 2min", matchType: "stablecoin_atomic" },
    { id: "TX-C9E4", flag: "🇺🇸→🇳🇬", sender: "Fatima A.", sendAmount: 1200, recvAmount: 1891200, fee: 19.2, speed: "instant", matchType: "ai_netting" },
    { id: "TX-D1F7", flag: "🇪🇺→🇬🇭", sender: "Chidi N.", sendAmount: 350, recvAmount: 5635, fee: 5.6, speed: "instant", matchType: "direct" },
    { id: "TX-E5A2", flag: "🇺🇸→🇬🇭", sender: "Grace M.", sendAmount: 800, recvAmount: 11968, fee: 13.6, speed: "< 2min", matchType: "liquidity_pool" },
  ];

  return NextResponse.json({
    corridors,
    participants,
    recentTx,
    aggregate: {
      totalVolume24h: 11_200_000,
      totalTx24h: 38_500,
      avgFeePct: 1.7,
      avgSpeedSec: 24,
      nettingEfficiency: 72,
      matchRate: 94.2,
      savingsVsMTO: 412,
    },
  });
}
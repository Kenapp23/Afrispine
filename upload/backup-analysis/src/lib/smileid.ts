// Mock Smile ID KYC integration
export async function submitKyc(params: { idType: string; idNumber: string; country: string; userId: string }): Promise<{ status: string; ref: string }> {
  console.log(`[SMILE_ID] KYC submit for ${params.userId}: ${params.idType} ${params.idNumber}`);
  return { status: 'approved', ref: `SMILE-${Date.now()}` };
}

export async function amlScreen(senderId: string, amountUsd: number, country: string): Promise<{ result: string; reason?: string }> {
  console.log(`[SMILE_ID] AML screen: sender=${senderId} amount=$${amountUsd}`);
  // Mock: 95% clear, 5% flagged for amounts > $5000
  if (amountUsd > 5000 && Math.random() < 0.05) {
    return { result: 'flagged', reason: 'High-value transaction flagged for review' };
  }
  return { result: 'clear' };
}
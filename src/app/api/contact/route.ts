import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Basic validation
    if (!name || !email || !message || !subject) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Send email via notification system
    const { sendContactForm } = await import('@/lib/notifications');
    await sendContactForm({ name, email, subject, message });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[contact]', e);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateKeys } from '@/lib/paystack';
import { withAdminAuth } from '@/lib/admin-auth';

// GET - retrieve keys (secret key masked)
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const configs = await db.platformConfig.findMany({
      where: { category: 'paystack' },
    });

    const result: Record<string, any> = {};
    for (const c of configs) {
      if (c.isSecret) {
        const val = c.value;
        if (val && val.length > 12) {
          result[c.key] = {
            masked: val.substring(0, 8) + '****' + val.substring(val.length - 4),
            isSet: true,
            length: val.length,
          };
        } else if (val) {
          result[c.key] = { masked: '****', isSet: true, length: val.length };
        } else {
          result[c.key] = { masked: '', isSet: false, length: 0 };
        }
      } else {
        result[c.key] = { value: c.value, isSet: !!c.value };
      }
    }

    return NextResponse.json({ keys: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
});

// POST - save/update keys
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const { secretKey, publicKey } = await req.json();

    if (!secretKey && !publicKey) {
      return NextResponse.json({ error: 'At least one key is required' }, { status: 400 });
    }

    // Validate key formats
    if (secretKey) {
      if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
        return NextResponse.json(
          { error: 'Secret key must start with sk_test_ or sk_live_' },
          { status: 400 }
        );
      }
    }
    if (publicKey) {
      if (!publicKey.startsWith('pk_test_') && !publicKey.startsWith('pk_live_')) {
        return NextResponse.json(
          { error: 'Public key must start with pk_test_ or pk_live_' },
          { status: 400 }
        );
      }
    }

    // Validate keys against Paystack API
    let validation = { valid: false };
    if (secretKey) {
      validation = await validateKeys(secretKey, publicKey || '');
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Key validation failed: ${validation.error}` },
          { status: 400 }
        );
      }
    }

    // Upsert keys into PlatformConfig
    const operations: Promise<any>[] = [];

    if (secretKey) {
      operations.push(
        db.platformConfig.upsert({
          where: { key: 'paystack_secret_key' },
          update: { value: secretKey, isSecret: true, category: 'paystack', description: 'Paystack Secret Key for server-side API calls' },
          create: { key: 'paystack_secret_key', value: secretKey, isSecret: true, category: 'paystack', description: 'Paystack Secret Key for server-side API calls' },
        })
      );
    }

    if (publicKey) {
      operations.push(
        db.platformConfig.upsert({
          where: { key: 'paystack_public_key' },
          update: { value: publicKey, isSecret: false, category: 'paystack', description: 'Paystack Public Key for client-side checkout' },
          create: { key: 'paystack_public_key', value: publicKey, isSecret: false, category: 'paystack', description: 'Paystack Public Key for client-side checkout' },
        })
      );
    }

    await Promise.all(operations);

    return NextResponse.json({
      success: true,
      message: validation.valid ? 'Keys validated and saved successfully' : 'Keys saved successfully',
      validated: validation.valid,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
});

// DELETE - remove keys
export const DELETE = withAdminAuth(async (req: NextRequest) => {
  try {
    const { key } = await req.json();
    if (!key || !['paystack_secret_key', 'paystack_public_key'].includes(key)) {
      return NextResponse.json({ error: 'Invalid key name' }, { status: 400 });
    }

    await db.platformConfig.deleteMany({ where: { key, category: 'paystack' } });
    return NextResponse.json({ success: true, message: `${key} removed` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
});
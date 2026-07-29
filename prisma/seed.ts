import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  // Seed admin user
  const adminEmail = 'admin@afrispine.com'
  const existingAdmin = await db.adminUser.findUnique({ where: { email: adminEmail } })
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@2026!', 12)
    await db.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: 'AfriSpine Admin',
        role: 'superadmin',
        isActive: true,
      },
    })
    console.log(`Created admin user: ${adminEmail} / Admin@2026!`)
  } else {
    console.log(`Admin user already exists: ${adminEmail}`)
  }

  // Seed liquidity providers for launch corridors
  const safaricom = await db.liquidityProvider.upsert({
    where: { id: 'lp-safaricom-mpesa-ke' },
    update: {},
    create: {
      id: 'lp-safaricom-mpesa-ke',
      name: 'Safaricom M-Pesa (Direct)',
      type: 'mno',
      baseUrl: 'https://api.safaricom.co.ke',
      supportedCorridors: JSON.stringify(['UK_KE', 'US_KE']),
      active: true,
      successRate: 0.985,
      avgSettleSeconds: 45,
      feeBps: 80,
    },
  })

  const integritti = await db.liquidityProvider.upsert({
    where: { id: 'lp-integritti-ke' },
    update: {},
    create: {
      id: 'lp-integritti-ke',
      name: 'Integriti M-Pesa',
      type: 'fintech',
      baseUrl: 'https://api.integriti.com',
      supportedCorridors: JSON.stringify(['UK_KE', 'US_KE']),
      active: true,
      successRate: 0.96,
      avgSettleSeconds: 90,
      feeBps: 120,
    },
  })

  console.log(`Seeded providers: ${safaricom.name}, ${integritti.name}`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())

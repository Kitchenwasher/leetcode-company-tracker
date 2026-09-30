import { prisma } from '../config/db.js';

async function grantPro() {
  const emailInput = process.argv[2];

  if (!emailInput) {
    console.error('\n❌ Error: Please specify the user email.');
    console.log('Usage:');
    console.log('  npm run grant-pro <user_email>\n');
    console.log('Example:');
    console.log('  npm run grant-pro friend@gmail.com\n');
    process.exit(1);
  }

  const targetEmail = emailInput.toLowerCase().trim();

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: targetEmail,
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      console.error(`\n❌ User with email "${targetEmail}" was not found in the database.`);
      console.log('💡 Tip: Ask your friend to sign up / log in to https://cheat-code.in first, then run this command again.\n');
      process.exit(1);
    }

    // 1. Upgrade user tier to 'pro' and subscriptionStatus to 'lifetime'
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        tier: 'pro',
        subscriptionStatus: 'lifetime',
      },
    });

    // 2. Create permanent lifetime payment record so bmcService subscription sync preserves Pro
    const sessionId = `admin_grant_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await prisma.payment.create({
      data: {
        userId: user.id,
        payerEmail: user.email,
        amount: 0,
        currency: 'INR',
        status: 'succeeded',
        plan: 'pro_lifetime',
        stripeSessionId: sessionId,
      },
    });

    console.log('\n========================================');
    console.log('🎉 PRO ACCESS GRANTED SUCCESSFULLY! 🎉');
    console.log('========================================');
    console.log(`👤 User:       ${updated.name || 'Anonymous'}`);
    console.log(`📧 Email:      ${updated.email}`);
    console.log(`💎 Tier:       ${updated.tier.toUpperCase()}`);
    console.log(`👑 Status:     ${updated.subscriptionStatus?.toUpperCase()}`);
    console.log(`💳 Payment ID: ${sessionId}`);
    console.log('========================================\n');
    console.log('Your friend can now refresh cheat-code.in and enjoy full Pro access forever!\n');

    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Failed to grant Pro access:', err?.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

grantPro();

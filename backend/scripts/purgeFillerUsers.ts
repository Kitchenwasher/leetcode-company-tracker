import { prisma } from '../src/config/db.js';

async function purgeFillerUsers() {
  console.log('==================================================');
  console.log('🧹 PURGING FILLER / DEMO USERS FROM NEON DATABASE');
  console.log('==================================================');

  // List of demo emails and IDs to purge
  const demoEmails = ['alex@faangprep.io', 'sarah@coder.dev', 'guest@leettracker.io'];
  const demoIds = ['user_alex_pro', 'user_sarah_free', 'guest'];

  const existingDemoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: demoEmails } },
        { id: { in: demoIds } },
      ],
    },
    select: { id: true, email: true, name: true },
  });

  console.log(`Found ${existingDemoUsers.length} filler users to delete:`, existingDemoUsers);

  if (existingDemoUsers.length > 0) {
    for (const u of existingDemoUsers) {
      // Cascade delete handles userProgress, activities, payments, etc.
      await prisma.user.delete({
        where: { id: u.id },
      });
      console.log(`Deleted filler user: ${u.email} (${u.id})`);
    }
  }

  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, tier: true },
  });

  console.log('Remaining real users in Neon DB:', remainingUsers);
  console.log('==================================================');
  console.log('✅ PURGE COMPLETED SUCCESSFULLY');
  console.log('==================================================');
}

purgeFillerUsers()
  .catch((err) => {
    console.error('Error purging filler users:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

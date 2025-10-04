import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUsernames() {
  try {
    console.log('🔄 Starting username migration...');

    // Get all users without usernames
    const usersWithoutUsernames = await prisma.user.findMany({
      where: {
        username: null
      }
    });

    console.log(`📊 Found ${usersWithoutUsernames.length} users without usernames`);

    for (const user of usersWithoutUsernames) {
      // Generate username from name
      let baseUsername = user.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 15); // Limit to 15 chars

      if (baseUsername.length < 3) {
        baseUsername = `user${user.id.substring(0, 8)}`;
      }

      let username = baseUsername;
      let counter = 1;

      // Check if username exists and find available one
      while (true) {
        const existingUser = await prisma.user.findUnique({
          where: { username }
        });

        if (!existingUser) {
          break;
        }

        username = `${baseUsername}${counter}`;
        counter++;
      }

      // Update user with username
      await prisma.user.update({
        where: { id: user.id },
        data: { username }
      });

      console.log(`✅ Updated user ${user.name} (${user.id}) with username: ${username}`);
    }

    console.log('🎉 Username migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during username migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUsernames();
}

export { migrateUsernames };

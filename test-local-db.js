// Test local SQLite database connection
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function testDatabase() {
  try {
    console.log('🔍 Testing local SQLite database connection...');
    
    // Test connection by counting users
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected! Found ${userCount} users.`);
    
    // Create a test user
    console.log('🔄 Creating a test user...');
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'test-hash-123'
      }
    });
    
    console.log(`✅ Test user created with ID: ${testUser.id}`);
    
    // Count users again
    const newUserCount = await prisma.user.count();
    console.log(`✅ Total users now: ${newUserCount}`);
    
    console.log('\n🎉 Local database is working perfectly!');
    
  } catch (error) {
    console.error('❌ Database test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();

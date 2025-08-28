const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database...');
    
    // Check users
    const users = await prisma.user.findMany();
    console.log('\nUsers found:', users.length);
    users.forEach(user => {
      console.log(`- User ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('');
    });
    
    // Check subjects
    const subjects = await prisma.subject.findMany();
    console.log('Subjects found:', subjects.length);
    subjects.forEach(subject => {
      console.log(`- Subject ID: ${subject.id}`);
      console.log(`  Name: ${subject.name}`);
      console.log(`  User ID: ${subject.userId}`);
      console.log(`  Color: ${subject.color}`);
      console.log(`  Description: ${subject.description}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

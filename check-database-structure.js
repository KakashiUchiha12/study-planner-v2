// Check the new database structure
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Checking new database structure...\n');
    
    // Check all models with correct Prisma casing
    const models = [
      { name: 'User', prismaName: 'user' },
      { name: 'Subject', prismaName: 'subject' },
      { name: 'Task', prismaName: 'task' },
      { name: 'StudySession', prismaName: 'studySession' },
      { name: 'StudyGoal', prismaName: 'studyGoal' },
      { name: 'TestMark', prismaName: 'testMark' },
      { name: 'UserSettings', prismaName: 'userSettings' },
      { name: 'Chapter', prismaName: 'chapter' },
      { name: 'Material', prismaName: 'material' },
      { name: 'DashboardSection', prismaName: 'dashboardSection' }
    ];
    
    for (const model of models) {
      try {
        const count = await prisma[model.prismaName].count();
        console.log(`✅ ${model.name}: ${count} records`);
      } catch (error) {
        console.log(`❌ ${model.name}: Error - ${error.message}`);
      }
    }
    
    console.log('\n🎉 Database structure verification complete!');
    
  } catch (error) {
    console.error('❌ Error checking database structure:');
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStructure();

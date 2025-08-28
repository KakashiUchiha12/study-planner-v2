const { PrismaClient } = require('@prisma/client')

async function testDatabaseServices() {
  console.log('🧪 Testing Database Service Layer...\n')
  
  const prisma = new PrismaClient()
  
  try {
    // Test database connection
    console.log('1. Testing database connection...')
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful\n')
    
    // Test user count
    console.log('2. Testing user count...')
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users\n`)
    
    // Test subject count
    console.log('3. Testing subject count...')
    const subjectCount = await prisma.subject.count()
    console.log(`✅ Found ${subjectCount} subjects\n`)
    
    // Test task count
    console.log('4. Testing task count...')
    const taskCount = await prisma.task.count()
    console.log(`✅ Found ${taskCount} tasks\n`)
    
    // Test study session count
    console.log('5. Testing study session count...')
    const sessionCount = await prisma.studySession.count()
    console.log(`✅ Found ${sessionCount} study sessions\n`)
    
    // Test test mark count
    console.log('6. Testing test mark count...')
    const testMarkCount = await prisma.testMark.count()
    console.log(`✅ Found ${testMarkCount} test marks\n`)
    
    // Test relationships
    console.log('7. Testing relationships...')
    const subjectsWithTasks = await prisma.subject.findMany({
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    })
    
    console.log('✅ Subject-Task relationships working:')
    subjectsWithTasks.forEach(subject => {
      console.log(`   - ${subject.name}: ${subject._count.tasks} tasks`)
    })
    
    console.log('\n🎉 All database service tests passed!')
    
  } catch (error) {
    console.error('❌ Database service test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testDatabaseServices().catch(console.error)

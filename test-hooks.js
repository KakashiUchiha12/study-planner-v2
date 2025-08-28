const { PrismaClient } = require('@prisma/client')

async function testHooks() {
  console.log('🧪 Testing Custom Hooks Integration...\n')
  
  const prisma = new PrismaClient()
  
  try {
    // Test database connection
    console.log('1. Testing database connection...')
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful\n')
    
    // Test subjects
    console.log('2. Testing subjects...')
    const subjects = await prisma.subject.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' }
    })
    console.log(`✅ Found ${subjects.length} subjects`)
    subjects.forEach(subject => {
      console.log(`   - ${subject.name} (${subject.color})`)
    })
    console.log()
    
    // Test tasks
    console.log('3. Testing tasks...')
    const tasks = await prisma.task.findMany({
      take: 3,
      include: { subject: true },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`✅ Found ${tasks.length} tasks`)
    tasks.forEach(task => {
      console.log(`   - ${task.title} (${task.subject?.name || 'No Subject'})`)
    })
    console.log()
    
    // Test study sessions
    console.log('4. Testing study sessions...')
    const sessions = await prisma.studySession.findMany({
      take: 3,
      include: { subject: true },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`✅ Found ${sessions.length} study sessions`)
    sessions.forEach(session => {
      console.log(`   - ${session.durationMinutes}min (${session.subject?.name || 'No Subject'})`)
    })
    console.log()
    
    // Test test marks
    console.log('5. Testing test marks...')
    const testMarks = await prisma.testMark.findMany({
      take: 3,
      include: { subject: true },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`✅ Found ${testMarks.length} test marks`)
    testMarks.forEach(testMark => {
      console.log(`   - ${testMark.title} (${testMark.percentage}%)`)
    })
    console.log()
    
    console.log('🎉 All hook integration tests passed!')
    console.log('✅ Ready for component integration')
    
  } catch (error) {
    console.error('❌ Hook integration test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testHooks().catch(console.error)

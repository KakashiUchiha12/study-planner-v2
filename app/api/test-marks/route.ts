import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { testMarkService } from '@/lib/database/test-mark-service'

export async function GET(request: NextRequest) {
  try {
    // Ensure the mistakes column exists
    await testMarkService.ensureMistakesColumnExists()
    
    const session = await getServerSession(authOptions)
    let userId = (session?.user as any)?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const testType = searchParams.get('testType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { userId: userId }
    if (subjectId && subjectId !== 'all') where.subjectId = subjectId
    if (testType && testType !== 'all') where.testType = testType
    if (startDate && endDate) {
      where.testDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const testMarks = await testMarkService.getTestMarksByUserId(userId)

    // Custom serialization to handle BigInt values
    const serializedTestMarks = JSON.parse(JSON.stringify(testMarks, (key, value) => {
      if (typeof value === 'bigint') {
        return Number(value)
      }
      return value
    }))

    return NextResponse.json(serializedTestMarks)
  } catch (error) {
    console.error('Failed to fetch test marks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test marks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    let userId = (session?.user as any)?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const body = await request.json()
    
    // Debug: Log what we're receiving
    console.log('🔍 API received test mark data:', body)
    console.log('🔍 Required fields check:', {
      subjectId: !!body.subjectId,
      testName: !!body.testName,
      testType: !!body.testType,
      testDate: !!body.testDate,
      score: !!body.score,
      maxScore: !!body.maxScore
    })
    
    // Validate required fields
    if (!body.subjectId || !body.testName || !body.testType || !body.testDate || !body.score || !body.maxScore) {
      console.error('Missing required fields:', { 
        body,
        missing: {
          subjectId: !body.subjectId,
          testName: !body.testName,
          testType: !body.testType,
          testDate: !body.testDate,
          score: !body.score,
          maxScore: !body.maxScore
        }
      })
      return NextResponse.json(
        { error: 'Missing required fields', details: {
          subjectId: !body.subjectId,
          testName: !body.testName,
          testType: !body.testType,
          testDate: !body.testDate,
          score: !body.score,
          maxScore: !body.maxScore
        }},
        { status: 400 }
      )
    }
    
    // Use the testMarkService to create the test mark
    const testMark = await testMarkService.createTestMark(userId, {
      subjectId: body.subjectId,
      testName: body.testName,
      testType: body.testType,
      score: body.score || 0,
      maxScore: body.maxScore || 100,
      testDate: new Date(body.testDate),
      notes: body.notes || undefined,
      mistakes: body.mistakes || undefined
    })

    console.log('✅ Test mark created successfully:', testMark)
    return NextResponse.json(testMark)
  } catch (error) {
    console.error('Failed to create test mark:', error)
    return NextResponse.json(
      { error: 'Failed to create test mark', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

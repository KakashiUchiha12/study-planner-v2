import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { testMarkService } from '@/lib/database/test-mark-service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    let userId = (session?.user as any)?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const { id: testMarkId } = await params
    const body = await request.json()

    console.log('🔍 API updating test mark:', { testMarkId, body })

    // Verify the test mark belongs to the user
    const existingTestMark = await testMarkService.getTestMarkById(testMarkId)

    if (!existingTestMark || existingTestMark.userId !== userId) {
      return NextResponse.json({ error: 'Test mark not found' }, { status: 404 })
    }

    const updatedTestMark = await testMarkService.updateTestMark(testMarkId, {
      testName: body.testName,
      testType: body.testType,
      score: body.marksObtained,
      maxScore: body.totalMarks,
      testDate: body.date ? new Date(body.date) : undefined,
      notes: body.comments || undefined,
      mistakes: body.mistakes || undefined
    })

    console.log('✅ Test mark updated successfully:', updatedTestMark)
    return NextResponse.json(updatedTestMark)
  } catch (error) {
    console.error('Failed to update test mark:', error)
    return NextResponse.json(
      { error: 'Failed to update test mark' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    let userId = (session?.user as any)?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const { id: testMarkId } = await params

    console.log('🔍 API deleting test mark:', { testMarkId, userId })

    // Verify the test mark belongs to the user
    const existingTestMark = await testMarkService.getTestMarkById(testMarkId)

    if (!existingTestMark || existingTestMark.userId !== userId) {
      return NextResponse.json({ error: 'Test mark not found' }, { status: 404 })
    }

    await testMarkService.deleteTestMark(testMarkId)

    console.log('✅ Test mark deleted successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete test mark:', error)
    return NextResponse.json(
      { error: 'Failed to delete test mark' },
      { status: 500 }
    )
  }
}

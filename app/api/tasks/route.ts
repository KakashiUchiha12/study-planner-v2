import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Tasks GET: Starting request...')
    
    const session = await getServerSession(authOptions)
    let userId = (session?.user as any)?.id

    console.log('🔍 API Tasks GET: Session:', !!session, 'UserId:', userId)

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
      console.log('🔍 API Tasks GET: Using demo user ID:', userId)
    }

    console.log('🔍 API Tasks GET: About to connect to database...')
    
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    console.log('🔍 API Tasks GET: Query params:', { subjectId, status, priority })

    const where: any = { userId: userId }
    if (subjectId && subjectId !== 'all') where.subjectId = subjectId
    if (status && status !== 'all') where.status = status
    if (priority && priority !== 'all') where.priority = priority

    console.log('🔍 API Tasks GET: Database query where clause:', where)

    console.log('🔍 API Tasks GET: Executing database query...')
    
    // Add retry logic for database connection issues
    let tasks
    let retries = 3
    
    while (retries > 0) {
      try {
        // Get tasks without ordering first to avoid order column issues
        tasks = await dbService.getPrisma().task.findMany({
          where: { userId: userId },
          include: { subject: true }
        })
        
        // If we get here, the query was successful
        break
      } catch (error) {
        retries--
        console.log(`🔍 API Tasks GET: Database attempt failed, retries left: ${retries}`)
        
        if (retries === 0) {
          throw error // Re-throw the error if all retries are exhausted
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    if (!tasks) {
      throw new Error('Failed to fetch tasks after all retries')
    }
    
    // Sort tasks by order, handling Int values properly
    const sortedTasks = tasks.sort((a, b) => {
      try {
        const orderA = a.order ? Number(a.order) : 0
        const orderB = b.order ? Number(b.order) : 0
        return orderA < orderB ? -1 : orderA > orderB ? 1 : 0
      } catch (error) {
        console.log('🔍 API Tasks GET: Error sorting task order:', error)
        return 0
      }
    })

    console.log('🔍 API Tasks GET: Found tasks:', sortedTasks.length)

    // Convert Int to string for JSON serialization
    const serializedTasks = sortedTasks.map(task => ({
      ...task,
      order: task.order ? task.order.toString() : '0'
    }))

    return NextResponse.json(serializedTasks)
  } catch (error) {
    console.error('🔍 API Tasks GET: Error:', error)
    console.error('🔍 API Tasks GET: Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API Tasks POST: Starting request...')
    
    const session = await getServerSession(authOptions)
    let userId = (session?.user as any)?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    console.log('🔍 API Tasks POST: UserId:', userId)

    const body = await request.json()
    
    console.log('🔍 API Tasks POST: Creating task with data:', {
      userId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      status: body.status,
      dueDate: body.dueDate,
      category: body.category,
      estimatedTime: body.estimatedTime,
      order: 'will be calculated'
    })
    
    console.log('🔍 API Tasks POST: About to connect to database...')
    
    // Use Int for order to match schema
    const newOrder = Math.floor(Math.random() * 1000) + 1000
    
    console.log('🔍 API Tasks POST: Using Int order:', newOrder)
    
    // Add retry logic for database connection issues
    let task
    let retries = 3
    
    while (retries > 0) {
      try {
                task = await dbService.getPrisma().task.create({
          data: {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: userId,
            subjectId: body.subjectId || null,
            title: body.title,
            description: body.description || '',
            priority: body.priority || 'medium',
            status: body.status || 'pending',
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            category: body.category || 'Study', // Add category support with default
            estimatedTime: body.estimatedTime !== undefined ? body.estimatedTime : null, // Add estimated time support
            order: newOrder // Use calculated order based on existing tasks
          }
        })
        
        // If we get here, the task was created successfully
        break
      } catch (error) {
        retries--
        console.log(`🔍 API Tasks POST: Database attempt failed, retries left: ${retries}`)
        
        if (retries === 0) {
          throw error // Re-throw the error if all retries are exhausted
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    if (!task) {
      throw new Error('Failed to create task after all retries')
    }
    
    console.log('🔍 API Tasks POST: Task created successfully:', {
      id: task.id,
      title: task.title,
      category: task.category,
      order: task.order
    })

    // Convert Int to string for JSON serialization
    const serializedTask = {
      ...task,
      order: task.order ? task.order.toString() : '0'
    }

    return NextResponse.json(serializedTask)
  } catch (error) {
    console.error('🔍 API Tasks POST: Error creating task:', error)
    console.error('🔍 API Tasks POST: Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    let userId = (session?.user as any)?.id

    // If no session, use demo user ID
    if (!userId) {
      userId = 'demo-user-1'
    }

    const body = await request.json()
    
    console.log('🔍 API Tasks PATCH: Reordering tasks:', {
      userId,
      taskCount: body.tasks?.length || 0
    })
    
    // Update task order in the database
    if (body.tasks && Array.isArray(body.tasks)) {
      console.log('🔍 API Tasks PATCH: Updating task order for:', body.tasks.map((t: any) => ({ id: t.id, title: t.title })))
      
      // Update each task with its new order using Int
      for (let i = 0; i < body.tasks.length; i++) {
        const task = body.tasks[i]
        await dbService.getPrisma().task.update({
          where: { id: task.id, userId: userId },
          data: { order: i }
        })
      }
      
      console.log('✅ API Tasks PATCH: Task order updated successfully in database')
      return NextResponse.json({ success: true, message: 'Task order updated successfully' })
    }
    
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update task order:', error)
    return NextResponse.json(
      { error: 'Failed to update task order' },
      { status: 500 }
    )
  }
}

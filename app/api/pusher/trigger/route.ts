import { NextRequest, NextResponse } from "next/server"
import { pusherServer } from "@/lib/pusher"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { channel, event, data } = await req.json()
    
    if (!pusherServer) {
      return NextResponse.json({ error: 'Pusher not configured' }, { status: 500 })
    }

    await pusherServer.trigger(channel, event, data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Pusher trigger error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

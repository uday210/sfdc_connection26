import { NextRequest, NextResponse } from 'next/server'
import { updateProjectDate } from '@/lib/salesforce'

export async function POST(req: NextRequest) {
  try {
    const { projectId, field, newDate } = await req.json()
    if (!projectId || !field || !newDate) {
      return NextResponse.json({ error: 'projectId, field, newDate required' }, { status: 400 })
    }
    await updateProjectDate(projectId, field, newDate)
    return NextResponse.json({ success: true, message: `${field} date updated to ${newDate}` })
  } catch (err) {
    console.error('POST /api/sf/update-date:', err)
    return NextResponse.json({ error: 'Failed to update date' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { logProjectNote } from '@/lib/salesforce'

export async function POST(req: NextRequest) {
  try {
    const { projectId, noteBody } = await req.json()
    if (!projectId || !noteBody) {
      return NextResponse.json({ error: 'projectId and noteBody required' }, { status: 400 })
    }
    await logProjectNote(projectId, noteBody)
    return NextResponse.json({ success: true, message: 'Note logged successfully' })
  } catch (err) {
    console.error('POST /api/sf/log-note:', err)
    return NextResponse.json({ error: 'Failed to log note' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getProject, getRecentActivity } from '@/lib/salesforce'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [project, lastActivity] = await Promise.all([
      getProject(id),
      getRecentActivity(id),
    ])
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ project: { ...project, LastActivity: lastActivity } })
  } catch (err) {
    console.error('GET /api/sf/projects/[id]:', err)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

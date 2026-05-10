import { NextResponse } from 'next/server'
import { getProjects } from '@/lib/salesforce'

export async function GET() {
  try {
    const projects = await getProjects()
    return NextResponse.json({ projects })
  } catch (err) {
    console.error('GET /api/sf/projects:', err)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

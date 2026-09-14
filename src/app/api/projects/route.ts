import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET: List user's projects
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new project
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate required field
    if (body.title !== undefined && typeof body.title !== 'string') {
      return NextResponse.json({ error: 'Invalid title field' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        title: body.title || 'Untitled',
        problemStatement: body.problemStatement || '',
        inputs: body.inputs || [],
        outputs: body.outputs || [],
        rules: body.rules || [],
        algorithm: body.algorithm || null,
        pythonCode: body.pythonCode || null,
        testCases: body.testCases || null,
        completedSteps: body.completedSteps || 0,
        isPublic: body.isPublic || false,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

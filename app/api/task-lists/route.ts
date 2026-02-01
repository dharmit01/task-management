import { requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db';
import TaskList from '@/models/TaskList';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createTaskListSchema = z.object({
  name: z.string().min(1, 'Task list name is required').max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

// GET /api/task-lists - Get all task lists
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    await connectDB();

    const taskLists = await TaskList.find()
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    return NextResponse.json({ success: true, taskLists }, { status: 200 });
  } catch (error) {
    console.error('Get task lists error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task lists' },
      { status: 500 }
    );
  }
}

// POST /api/task-lists - Create new task list
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();

    // Validate input
    const validationResult = createTaskListSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    // Check for duplicate name
    const existing = await TaskList.findOne({ name: validationResult.data.name });
    if (existing) {
      return NextResponse.json(
        { error: 'A task list with this name already exists' },
        { status: 400 }
      );
    }

    const newTaskList = await TaskList.create({
      ...validationResult.data,
      createdBy: authResult.user!._id,
    });

    await newTaskList.populate('createdBy', 'name email');

    return NextResponse.json(
      { success: true, taskList: newTaskList },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create task list error:', error);
    return NextResponse.json(
      { error: 'Failed to create task list' },
      { status: 500 }
    );
  }
}

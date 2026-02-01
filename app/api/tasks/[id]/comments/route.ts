import { isAdmin, requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Comment from '@/models/Comment';
import Task from '@/models/Task';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createCommentSchema = z.object({
  commentText: z.string().min(1, 'Comment text is required'),
});

// GET /api/tasks/[id]/comments - Get comments for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    await connectDB();

    // Verify task exists and user has access
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user can access comments (admin, assignee, or creator)
    if (!isAdmin(authResult.user)) {
      const assignedToArray = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
      const isAssignee = assignedToArray.some(
        (assigneeId: any) => assigneeId.toString() === authResult.user._id.toString()
      );
      const isCreator = task.createdBy.toString() === authResult.user._id.toString();
      
      if (!isAssignee && !isCreator) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    const comments = await Comment.find({ taskId: id })
      .populate('userId', 'name email role')
      .sort({ createdAt: 1 }); // Chronological order

    return NextResponse.json({ success: true, comments }, { status: 200 });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/comments - Add comment to a task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = createCommentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify task exists and user has access
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user can comment (admin, assignee, or creator)
    if (!isAdmin(authResult.user)) {
      const assignedToArray = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
      const isAssignee = assignedToArray.some(
        (assigneeId: any) => assigneeId.toString() === authResult.user._id.toString()
      );
      const isCreator = task.createdBy.toString() === authResult.user._id.toString();
      
      if (!isAssignee && !isCreator) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Create comment
    const newComment = await Comment.create({
      taskId: id,
      userId: authResult.user._id,
      commentText: validationResult.data.commentText,
    });

    // Populate user details
    await newComment.populate('userId', 'name email role');

    return NextResponse.json(
      { success: true, comment: newComment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

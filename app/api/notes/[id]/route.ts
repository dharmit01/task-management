import { requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { sanitizeHtml, sanitizeTitle } from '@/lib/sanitize';
import Note from '@/models/Note';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
});

// GET /api/notes/[id] - Get specific note
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

    const note = await Note.findById(id).populate('createdBy', 'name email');

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Users can only view their own notes
    if (note.createdBy._id.toString() !== authResult.user!._id.toString()) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, note }, { status: 200 });
  } catch (error) {
    console.error('Get note error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

// PATCH /api/notes/[id] - Update note
export async function PATCH(
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
    const validationResult = updateNoteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    const note = await Note.findById(id);

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Users can only update their own notes
    if (note.createdBy.toString() !== authResult.user!._id.toString()) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Sanitize updated data
    const updateData: Record<string, string> = {};
    if (validationResult.data.title) {
      updateData.title = sanitizeTitle(validationResult.data.title);
    }
    if (validationResult.data.content) {
      updateData.content = sanitizeHtml(validationResult.data.content);
    }

    const updatedNote = await Note.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    return NextResponse.json(
      { success: true, note: updatedNote },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update note error:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/[id] - Delete note
export async function DELETE(
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

    const note = await Note.findById(id);

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Users can only delete their own notes
    if (note.createdBy.toString() !== authResult.user!._id.toString()) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await Note.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: 'Note deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}

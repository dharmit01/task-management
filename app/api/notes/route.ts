import { requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { sanitizeHtml, sanitizeTitle } from '@/lib/sanitize';
import Note from '@/models/Note';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
});

// GET /api/notes - List all notes for the authenticated user
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {
      createdBy: authResult.user!._id,
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const notes = await Note.find(query)
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 }); // Most recently updated first

    return NextResponse.json({ success: true, notes }, { status: 200 });
  } catch (error) {
    console.error('Get notes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();

    // Validate input
    const validationResult = createNoteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { title, content } = validationResult.data;

    // Sanitize input to prevent XSS
    const sanitizedTitle = sanitizeTitle(title);
    const sanitizedContent = sanitizeHtml(content);

    await connectDB();

    // Create new note
    const newNote = await Note.create({
      title: sanitizedTitle,
      content: sanitizedContent,
      createdBy: authResult.user!._id,
    });

    // Populate creator details
    await newNote.populate('createdBy', 'name email');

    return NextResponse.json(
      { success: true, note: newNote },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

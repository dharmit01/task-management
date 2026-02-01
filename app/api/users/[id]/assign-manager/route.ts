import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const assignManagerSchema = z.object({
  managerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid manager ID').nullable(),
});

// PATCH /api/users/[id]/assign-manager - Assign/unassign manager (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = assignManagerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { managerId } = validationResult.data;

    await connectDB();

    // Get the user to be assigned
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only Members can be assigned to managers
    if (user.role !== 'Member') {
      return NextResponse.json(
        { error: 'Only Members can be assigned to managers. Managers and Admins cannot be assigned.' },
        { status: 400 }
      );
    }

    // If managerId is provided, validate the manager exists and has Manager role
    if (managerId) {
      const manager = await User.findById(managerId);

      if (!manager) {
        return NextResponse.json(
          { error: 'Manager not found' },
          { status: 404 }
        );
      }

      if (manager.role !== 'Manager') {
        return NextResponse.json(
          { error: 'Selected user is not a Manager' },
          { status: 400 }
        );
      }
    }

    // Store old managerId for task deallocation (handled by User model pre-save hook)
    const oldManagerId = user.managerId;

    // Update the user's managerId
    user.managerId = managerId ? new Types.ObjectId(managerId) : undefined;
    await user.save(); // This triggers the pre-save hook that deallocates tasks

    const updatedUser = await User.findById(id)
      .select('-password')
      .populate('managerId', 'name email');

    return NextResponse.json(
      {
        success: true,
        user: updatedUser,
        message: managerId
          ? `Member assigned to manager successfully${oldManagerId ? '. Tasks from previous manager have been deallocated.' : ''}`
          : 'Manager unassigned successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Assign manager error:', error);
    return NextResponse.json(
      { error: 'Failed to assign manager' },
      { status: 500 }
    );
  }
}

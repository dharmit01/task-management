import { requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
});

// PATCH /api/users/profile - Update own profile
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const userId = authResult.user._id;

    // Validate input
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email is being changed and if it already exists
    if (validationResult.data.email) {
      const existingUser = await User.findOne({ 
        email: validationResult.data.email,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use by another account' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: validationResult.data },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

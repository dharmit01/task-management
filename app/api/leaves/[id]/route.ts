import { isAdmin, isManager, isManagerOrAdmin, requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { isInTeam } from '@/lib/team-utils';
import Leave from '@/models/Leave';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateLeaveSchema = z.object({
  status: z.enum(['approved', 'rejected']).optional(),
  rejectionReason: z.string().max(500).optional(),
});

// GET /api/leaves/[id] - Get specific leave
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

    const leave = await Leave.findById(id)
      .populate('applicant', 'name email role')
      .populate('approvedBy', 'name email');

    if (!leave) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
    }

    // Permission check: Admin sees all, Manager sees team leaves, Members see own leaves
    if (!isAdmin(authResult.user)) {
      const isOwnLeave = leave.applicant._id.toString() === authResult.user._id.toString();
      let isTeamMemberLeave = false;
      
      if (isManager(authResult.user)) {
        isTeamMemberLeave = await isInTeam(authResult.user._id, leave.applicant._id);
      }
      
      if (!isOwnLeave && !isTeamMemberLeave) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, leave }, { status: 200 });
  } catch (error) {
    console.error('Get leave error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave' },
      { status: 500 }
    );
  }
}

// PATCH /api/leaves/[id] - Update leave (Admin only - for approval/rejection)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  // Only admins and managers can approve/reject leaves
  if (!isManagerOrAdmin(authResult.user)) {
    return NextResponse.json(
      { error: 'Only admins and managers can approve or reject leaves' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateLeaveSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    const leave = await Leave.findById(id).populate('applicant');

    if (!leave) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
    }
    
    // Managers can only approve/reject leaves for their team members
    if (isManager(authResult.user) && !isAdmin(authResult.user)) {
      const isTeamMember = await isInTeam(authResult.user._id, leave.applicant._id);
      
      if (!isTeamMember) {
        return NextResponse.json(
          { error: 'You can only approve or reject leaves for your team members' },
          { status: 403 }
        );
      }
    }

    // Cannot update already processed leaves
    if (leave.status !== 'pending') {
      return NextResponse.json(
        { error: `Leave is already ${leave.status}` },
        { status: 400 }
      );
    }

    const updateData: { approvedBy: string; status?: string; rejectionReason?: string } = {
      approvedBy: authResult.user!._id.toString(),
    };

    if (validationResult.data.status) {
      updateData.status = validationResult.data.status;
    }

    if (validationResult.data.rejectionReason) {
      updateData.rejectionReason = validationResult.data.rejectionReason;
    }

    // Validate: Rejection must have a reason
    if (updateData.status === 'rejected' && !updateData.rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('applicant', 'name email role')
      .populate('approvedBy', 'name email');

    return NextResponse.json(
      { success: true, leave: updatedLeave },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update leave error:', error);
    return NextResponse.json(
      { error: 'Failed to update leave' },
      { status: 500 }
    );
  }
}

// DELETE /api/leaves/[id] - Delete leave (Admin or applicant can cancel pending leaves)
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

    const leave = await Leave.findById(id);

    if (!leave) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
    }

    // Check permissions: Admin or the applicant themselves (only for pending leaves)
    const userIsAdmin = isAdmin(authResult.user);
    const userIsApplicant = leave.applicant.toString() === authResult.user!._id.toString();

    if (!userIsAdmin && !userIsApplicant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Members can only cancel pending leaves
    if (!userIsAdmin && leave.status !== 'pending') {
      return NextResponse.json(
        { error: 'You can only cancel pending leave applications' },
        { status: 403 }
      );
    }

    await Leave.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: 'Leave application cancelled successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete leave error:', error);
    return NextResponse.json(
      { error: 'Failed to delete leave' },
      { status: 500 }
    );
  }
}

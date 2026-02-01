import { isAdmin, isManager, requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { calculateLeaveDays } from '@/lib/leave-utils';
import { getTeamMembers } from '@/lib/team-utils';
import Leave from '@/models/Leave';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createLeaveSchema = z.object({
  leaveType: z.enum(['full', 'half']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
});

// GET /api/leaves - List leaves (filtered by role)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const applicantId = searchParams.get('applicant');
    const filter = searchParams.get('filter'); // 'today', 'upcoming', 'past'

    const query: Record<string, unknown> = {};

    // Role-based filtering:
    // - Admins see all leaves
    // - Managers see their own leaves and their team's leaves
    // - Members see only their own leaves
    if (isAdmin(authResult.user)) {
      // Admin sees all - apply applicant filter if specified
      if (applicantId) {
        query.applicant = applicantId;
      }
    } else if (isManager(authResult.user)) {
      // Manager sees their own leaves and their team members' leaves
      const teamMembers = await getTeamMembers(authResult.user._id);
      const teamMemberIds = teamMembers.map(m => m._id);
      
      query.applicant = { $in: [authResult.user._id, ...teamMemberIds] };
      
      // If applicant filter is specified, apply it (must be in allowed scope)
      if (applicantId) {
        query.applicant = applicantId;
      }
    } else {
      // Member sees only their own leaves
      query.applicant = authResult.user._id;
      
      if (applicantId) {
        query.applicant = applicantId;
      }
    }

    // Apply status filter
    if (status) {
      query.status = status;
    }

    // Special filters
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'today') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query.startDate = { $lte: tomorrow };
      query.endDate = { $gte: today };
      query.status = 'approved';
    } else if (filter === 'upcoming') {
      query.startDate = { $gt: today };
      query.status = 'approved';
    } else if (filter === 'past') {
      query.endDate = { $lt: today };
    }

    const leaves = await Leave.find(query)
      .populate('applicant', 'name email role')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, leaves }, { status: 200 });
  } catch (error) {
    console.error('Get leaves error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaves' },
      { status: 500 }
    );
  }
}

// POST /api/leaves - Create new leave application (Members and Admins)
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();

    // Validate input
    const validationResult = createLeaveSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { leaveType, startDate, endDate, reason } = validationResult.data;

    await connectDB();

    // Get user's current leave balance
    const user = await User.findById(authResult.user!._id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate leave days
    const leaveDays = calculateLeaveDays(new Date(startDate), new Date(endDate), leaveType);

    // Validate: Check if user has enough leave balance
    const pendingAndApprovedLeaves = await Leave.find({
      applicant: authResult.user!._id,
      status: { $in: ['pending', 'approved'] },
    });

    const usedLeaves = pendingAndApprovedLeaves.reduce((sum, leave) => sum + leave.leaveDays, 0);
    const availableBalance = user.annualLeaveBalance - usedLeaves;

    if (leaveDays > availableBalance) {
      return NextResponse.json(
        { 
          error: 'Insufficient leave balance',
          details: {
            requested: leaveDays,
            available: availableBalance,
            total: user.annualLeaveBalance,
            used: usedLeaves,
          }
        },
        { status: 400 }
      );
    }

    // Validate: Half day leaves must be single day
    if (leaveType === 'half') {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      if (start.getTime() !== end.getTime()) {
        return NextResponse.json(
          { error: 'Half day leave must be for a single day' },
          { status: 400 }
        );
      }
    }

    // Create new leave application
    const newLeave = await Leave.create({
      applicant: authResult.user!._id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      leaveDays,
      status: 'pending',
    });

    // Populate references
    await newLeave.populate('applicant', 'name email role');

    return NextResponse.json(
      { success: true, leave: newLeave },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create leave error:', error);
    return NextResponse.json(
      { error: 'Failed to create leave application' },
      { status: 500 }
    );
  }
}

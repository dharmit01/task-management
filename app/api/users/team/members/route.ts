import { requireManagerOrAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import { getTeamMembers } from '@/lib/team-utils';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/users/team/members - Get manager's team members
export async function GET(request: NextRequest) {
  const authResult = await requireManagerOrAdmin(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    await connectDB();

    const teamMembers = await getTeamMembers(authResult.user._id);

    return NextResponse.json(
      { success: true, teamMembers },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

import { requireManagerOrAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import { getAssignableUsers } from '@/lib/team-utils';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/users/assignable - Get assignable users for manager (team + managers + admins)
export async function GET(request: NextRequest) {
  const authResult = await requireManagerOrAdmin(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    await connectDB();

    const users = await getAssignableUsers(authResult.user._id);

    return NextResponse.json(
      { success: true, users },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get assignable users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignable users' },
      { status: 500 }
    );
  }
}

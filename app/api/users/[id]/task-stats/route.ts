import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Task from "@/models/Task";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export interface MemberTaskStats {
  total: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

/**
 * GET /api/users/[id]/task-stats
 * Returns accurate aggregated task counts for a specific member (admin only).
 * Runs a single MongoDB $facet aggregation so the DB does all the counting
 * instead of fetching every task document to the server.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    await connectDB();

    const userId = new Types.ObjectId(id);
    const now = new Date();

    // Single aggregation — one round-trip to the DB
    const [result] = await Task.aggregate<{
      total: number;
      inProgress: number;
      completed: number;
      overdue: number;
    }>([
      { $match: { assignedTo: userId } },
      {
        $facet: {
          total: [{ $count: "count" }],
          inProgress: [
            { $match: { status: "In-Progress" } },
            { $count: "count" },
          ],
          completed: [{ $match: { status: "Completed" } }, { $count: "count" }],
          overdue: [
            {
              $match: {
                endDate: { $lt: now },
                status: { $ne: "Completed" },
              },
            },
            { $count: "count" },
          ],
        },
      },
      {
        $project: {
          total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
          inProgress: {
            $ifNull: [{ $arrayElemAt: ["$inProgress.count", 0] }, 0],
          },
          completed: {
            $ifNull: [{ $arrayElemAt: ["$completed.count", 0] }, 0],
          },
          overdue: {
            $ifNull: [{ $arrayElemAt: ["$overdue.count", 0] }, 0],
          },
        },
      },
    ]);

    const stats: MemberTaskStats = result ?? {
      total: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
    };

    return NextResponse.json({ success: true, stats }, { status: 200 });
  } catch (error) {
    console.error("Member task-stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task statistics" },
      { status: 500 },
    );
  }
}

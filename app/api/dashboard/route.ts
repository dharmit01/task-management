import { isAdmin, isManager, requireAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import {
  DASHBOARD_PRIORITIES,
  DASHBOARD_STATUSES,
  type DashboardApiResponse,
  type DashboardPriorityDatum,
  type DashboardStatusDatum,
  type DashboardSummaryStats,
  type DashboardTaskListDatum,
} from "@/lib/dashboard/types";
import { getTeamMembers } from "@/lib/team-utils";
import Task from "@/models/Task";
import TaskList from "@/models/TaskList";
import { type PipelineStage, type Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

type DashboardMatch = Record<string, unknown>;

type SummaryAggregation = Omit<DashboardSummaryStats, "completionRate">;

type SummaryFacetRow = SummaryAggregation & { _id: null };

type GroupFacetRow = {
  _id: string | null;
  count: number;
};

type TaskListFacetRow = DashboardTaskListDatum;

type DashboardFacetResult = {
  summary: SummaryFacetRow[];
  byStatus: GroupFacetRow[];
  byPriority: GroupFacetRow[];
  byTaskList: TaskListFacetRow[];
};

const EMPTY_STATS: DashboardSummaryStats = {
  total: 0,
  completed: 0,
  today: 0,
  overdue: 0,
  highPriority: 0,
  blocked: 0,
  inReview: 0,
  dueThisWeek: 0,
  completionRate: 0,
};

async function buildDashboardMatch(
  userId: Types.ObjectId,
  role: "Admin" | "Manager" | "Member",
): Promise<DashboardMatch> {
  if (role === "Admin") {
    return {};
  }

  if (role === "Manager") {
    const teamMembers = await getTeamMembers(userId);
    const teamMemberIds = teamMembers.map((member) => member._id);

    return {
      $or: [
        { createdBy: userId },
        { assignedTo: { $in: [userId] } },
        { assignedTo: { $in: teamMemberIds } },
      ],
    };
  }

  return {
    assignedTo: { $in: [userId] },
  };
}

function buildSummaryStats(summary?: SummaryFacetRow): DashboardSummaryStats {
  if (!summary) {
    return EMPTY_STATS;
  }

  const completionRate =
    summary.total > 0
      ? Number(((summary.completed / summary.total) * 100).toFixed(1))
      : 0;

  return {
    total: summary.total,
    completed: summary.completed,
    today: summary.today,
    overdue: summary.overdue,
    highPriority: summary.highPriority,
    blocked: summary.blocked,
    inReview: summary.inReview,
    dueThisWeek: summary.dueThisWeek,
    completionRate,
  };
}

function normalizeStatusData(rows: GroupFacetRow[]): DashboardStatusDatum[] {
  const counts = new Map(rows.map((row) => [row._id, row.count]));

  return DASHBOARD_STATUSES.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));
}

function normalizePriorityData(rows: GroupFacetRow[]): DashboardPriorityDatum[] {
  const counts = new Map(rows.map((row) => [row._id, row.count]));

  return DASHBOARD_PRIORITIES.map((priority) => ({
    priority,
    count: counts.get(priority) ?? 0,
  }));
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    await connectDB();

    const user = authResult.user;
    const role = isAdmin(user)
      ? "Admin"
      : isManager(user)
        ? "Manager"
        : "Member";

    const match = await buildDashboardMatch(user._id, role);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(todayStart);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
                  },
                },
                today: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ["$startDate", todayStart] },
                          { $lt: ["$startDate", tomorrow] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                overdue: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $lt: ["$endDate", now] },
                          { $ne: ["$status", "Completed"] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                highPriority: {
                  $sum: {
                    $cond: [{ $in: ["$priority", ["High", "Critical"]] }, 1, 0],
                  },
                },
                blocked: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "Blocked"] }, 1, 0],
                  },
                },
                inReview: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "In-Review"] }, 1, 0],
                  },
                },
                dueThisWeek: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ["$endDate", todayStart] },
                          { $lt: ["$endDate", nextWeek] },
                          { $ne: ["$status", "Completed"] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          byStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          byPriority: [
            {
              $group: {
                _id: "$priority",
                count: { $sum: 1 },
              },
            },
          ],
          byTaskList: [
            {
              $group: {
                _id: "$taskList",
                total: { $sum: 1 },
                completed: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
                  },
                },
              },
            },
            {
              $lookup: {
                from: TaskList.collection.name,
                localField: "_id",
                foreignField: "_id",
                as: "taskList",
              },
            },
            {
              $unwind: {
                path: "$taskList",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 0,
                taskListId: { $toString: "$_id" },
                name: { $ifNull: ["$taskList.name", "Unknown"] },
                color: { $ifNull: ["$taskList.color", "#64748b"] },
                total: 1,
                completed: 1,
              },
            },
            {
              $sort: {
                total: -1,
                name: 1,
              },
            },
          ],
        },
      },
    ];

    const [result] = await Task.aggregate<DashboardFacetResult>(pipeline);
    const response: DashboardApiResponse = {
      success: true,
      stats: buildSummaryStats(result?.summary[0]),
      charts: {
        byStatus: normalizeStatusData(result?.byStatus ?? []),
        byPriority: normalizePriorityData(result?.byPriority ?? []),
        byTaskList: result?.byTaskList ?? [],
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Get dashboard data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}

import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Task from "@/models/Task";
import TaskList from "@/models/TaskList";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

interface StatusStats {
  total: number;
  ToDo: number;
  "In-Progress": number;
  Blocked: number;
  "In-Review": number;
  Completed: number;
}

const EMPTY_STATS: StatusStats = {
  total: 0,
  ToDo: 0,
  "In-Progress": 0,
  Blocked: 0,
  "In-Review": 0,
  Completed: 0,
};

const createTaskListSchema = z.object({
  name: z.string().min(1, "Task list name is required").max(100),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .optional(),
});

// GET /api/task-lists - Get all task lists
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    await connectDB();

    const taskLists = await TaskList.find()
      .populate("createdBy", "name email")
      .sort({ name: 1 });

    // Aggregate task counts per task-list and status in a single DB round-trip
    const taskCounts = await Task.aggregate<{
      _id: { taskList: unknown; status: string };
      count: number;
    }>([
      {
        $group: {
          _id: { taskList: "$taskList", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap: Record<string, StatusStats> = {};
    for (const item of taskCounts) {
      const tlId = item._id.taskList?.toString();
      if (!tlId) continue;
      if (!statsMap[tlId]) statsMap[tlId] = { ...EMPTY_STATS };
      const status = item._id.status as keyof StatusStats;
      if (status !== "total" && status in statsMap[tlId]) {
        statsMap[tlId][status] = item.count;
      }
      statsMap[tlId].total += item.count;
    }

    const taskListsWithStats = taskLists.map((tl) => ({
      ...tl.toObject(),
      stats: statsMap[tl._id.toString()] ?? { ...EMPTY_STATS },
    }));

    return NextResponse.json(
      { success: true, taskLists: taskListsWithStats },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get task lists error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task lists" },
      { status: 500 },
    );
  }
}

// POST /api/task-lists - Create new task list
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();

    // Validate input
    const validationResult = createTaskListSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    await connectDB();

    // Check for duplicate name
    const existing = await TaskList.findOne({
      name: validationResult.data.name,
    });
    if (existing) {
      return NextResponse.json(
        { error: "A task list with this name already exists" },
        { status: 400 },
      );
    }

    const newTaskList = await TaskList.create({
      ...validationResult.data,
      createdBy: authResult.user!._id,
    });

    await newTaskList.populate("createdBy", "name email");

    return NextResponse.json(
      { success: true, taskList: newTaskList },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create task list error:", error);
    return NextResponse.json(
      { error: "Failed to create task list" },
      { status: 500 },
    );
  }
}

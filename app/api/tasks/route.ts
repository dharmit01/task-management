import { isAdmin, isManager, requireAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { getTeamMembers, validateTaskAssignment } from "@/lib/team-utils";
import { getNextSequence } from "@/models/Counter";
import Task from "@/models/Task";
import TaskList from "@/models/TaskList";
import User from "@/models/User";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  taskList: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid task list ID"),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  assignedTo: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"))
    .optional(),
  status: z
    .enum(["ToDo", "In-Progress", "Blocked", "In-Review", "Completed"])
    .optional(),
});

// GET /api/tasks - List tasks (filtered by role)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    await connectDB();

    // Ensure models are registered
    TaskList;
    User;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedTo = searchParams.get("assignedTo");
    const taskListId = searchParams.get("taskList");
    const filter = searchParams.get("filter"); // 'today', 'overdue', 'high-priority', 'unassigned'

    const query: Record<string, unknown> = {};

    // Role-based filtering:
    // - Admins see all tasks
    // - Managers see tasks created by them OR assigned to them OR assigned to their team members
    // - Members see only their own tasks
    if (isAdmin(authResult.user)) {
      // Admin sees all - apply assignedTo filter only if specified
      if (assignedTo) {
        query.assignedTo = { $in: [assignedTo] };
      }
    } else if (isManager(authResult.user)) {
      // Manager sees: tasks created by them OR assigned to them OR assigned to their team
      const teamMembers = await getTeamMembers(authResult.user._id);
      const teamMemberIds = teamMembers.map((m) => m._id);

      query.$or = [
        { createdBy: authResult.user._id },
        { assignedTo: { $in: [authResult.user._id] } },
        { assignedTo: { $in: teamMemberIds } },
      ];

      // If assignedTo filter is specified, add it to the query
      if (assignedTo) {
        query.assignedTo = { $in: [assignedTo] };
      }
    } else {
      // Member sees only their tasks
      query.assignedTo = { $in: [authResult.user._id] };

      if (assignedTo) {
        query.assignedTo = { $in: [assignedTo] };
      }
    }

    // Handle unassigned filter
    if (filter === "unassigned") {
      query.$or = [
        { assignedTo: { $exists: false } },
        { assignedTo: { $size: 0 } },
        { assignedTo: null },
      ];
    }

    // Apply filters
    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (taskListId) {
      query.taskList = taskListId;
    }

    // Special filters
    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      query.startDate = { $gte: today, $lt: tomorrow };
    } else if (filter === "overdue") {
      const now = new Date();
      query.endDate = { $lt: now };
      query.status = { $ne: "Completed" };
    } else if (filter === "high-priority") {
      query.priority = { $in: ["High", "Critical"] };
    }

    // Search by title or description (case-insensitive, escaped to prevent ReDoS)
    const search = searchParams.get("search");
    if (search && search.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchOr: Record<string, unknown>[] = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
      ];
      if (query.$or) {
        // Combine existing role-based $or with search $or via $and
        query.$and = [
          { $or: query.$or as Record<string, unknown>[] },
          { $or: searchOr },
        ];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("taskList", "name color")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, tasks }, { status: 200 });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

// POST /api/tasks - Create new task (Members and Admins)
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  // Members and admins and managers can create tasks
  try {
    const body = await request.json();

    // Validate input
    const validationResult = createTaskSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const taskData = validationResult.data;

    await connectDB();

    // Validate task assignment for managers
    if (
      isManager(authResult.user) &&
      taskData.assignedTo &&
      taskData.assignedTo.length > 0
    ) {
      const invalidIds = await validateTaskAssignment(
        authResult.user._id,
        taskData.assignedTo,
      );

      if (invalidIds.length > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot assign task to users outside your team. You can only assign to your team members, other Managers, or Admins.",
            invalidUserIds: invalidIds,
          },
          { status: 403 },
        );
      }
    }

    // Convert assignedTo strings to ObjectIds if provided
    const assignedToIds = taskData.assignedTo
      ? taskData.assignedTo.map((id: string) => new Types.ObjectId(id))
      : [];

    // Generate human-readable task ID atomically
    const seq = await getNextSequence("task");
    const taskId = `TSK-${seq}`;

    // Create initial audit log entry
    const initialAuditLog = [
      {
        actor: authResult.user._id,
        action: "Task Created",
        field: "task",
        oldValue: null,
        newValue: null,
        timestamp: new Date(),
      },
    ];

    // Create new task
    const newTask = await Task.create({
      ...taskData,
      taskId,
      assignedTo: assignedToIds,
      createdBy: authResult.user._id,
      status: taskData.status || "ToDo",
      auditLog: initialAuditLog,
    });

    // Populate references
    await newTask.populate("assignedTo", "name email");
    await newTask.populate("createdBy", "name email");

    return NextResponse.json({ success: true, task: newTask }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}

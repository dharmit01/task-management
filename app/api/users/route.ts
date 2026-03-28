import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Task from "@/models/Task";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Admin", "Manager", "Member"]),
  managerId: z.string().optional(),
});

// GET /api/users - List all users (Admin only)
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    await connectDB();

    const users = await User.aggregate([
      {
        $lookup: {
          from: Task.collection.name,
          let: { userId: "$_id" },
          pipeline: [
            { $match: { $expr: { $in: ["$$userId", "$assignedTo"] } } },
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          as: "taskStats",
        },
      },
      {
        $addFields: {
          tasksCount: {
            $reduce: {
              input: "$taskStats",
              initialValue: 0,
              in: { $add: ["$$value", "$$this.count"] },
            },
          },
          toDoTasks: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$taskStats",
                      as: "stat",
                      cond: { $eq: ["$$stat._id", "ToDo"] },
                    },
                  },
                  0,
                ],
              },
              0,
            ],
          },
          inProgressTasks: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$taskStats",
                      as: "stat",
                      cond: { $eq: ["$$stat._id", "In-Progress"] },
                    },
                  },
                  0,
                ],
              },
              0,
            ],
          },
          inReviewTasks: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$taskStats",
                      as: "stat",
                      cond: { $eq: ["$$stat._id", "In-Review"] },
                    },
                  },
                  0,
                ],
              },
              0,
            ],
          },
          completedTasks: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$taskStats",
                      as: "stat",
                      cond: { $eq: ["$$stat._id", "Completed"] },
                    },
                  },
                  0,
                ],
              },
              0,
            ],
          },
          blockedTasks: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$taskStats",
                      as: "stat",
                      cond: { $eq: ["$$stat._id", "Blocked"] },
                    },
                  },
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          toDoTasks: "$toDoTasks.count",
          inProgressTasks: "$inProgressTasks.count",
          inReviewTasks: "$inReviewTasks.count",
          completedTasks: "$completedTasks.count",
          blockedTasks: "$blockedTasks.count",
        },
      },
      { $unset: ["password", "taskStats"] },
      { $sort: { createdAt: -1 } },
    ]);

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// POST /api/users - Create new user (Admin only)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();

    // Validate input
    const validationResult = createUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const { name, username, email, password, role, managerId } =
      validationResult.data;

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this username already exists" },
        { status: 409 },
      );
    }

    // Validate managerId if provided
    if (managerId) {
      if (role !== "Member") {
        return NextResponse.json(
          { error: "Only Members can be assigned to a Manager" },
          { status: 400 },
        );
      }
      const manager = await User.findById(managerId);
      if (!manager) {
        return NextResponse.json(
          { error: "Manager not found" },
          { status: 404 },
        );
      }
      if (manager.role !== "Manager" && manager.role !== "Admin") {
        return NextResponse.json(
          { error: "Selected user is not a Manager or Admin" },
          { status: 400 },
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      name,
      username: username.toLowerCase(),
      ...(email && { email: email.toLowerCase() }),
      password: hashedPassword,
      role,
      isActive: true,
      ...(managerId && { managerId }),
    });

    // Ensure indexes are synced (important for username unique constraint)
    await User.syncIndexes();

    console.log("User created successfully:", {
      id: newUser._id,
      username: newUser.username,
      name: newUser.name,
    });

    // Return user data (without password)
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json(
      { success: true, user: userResponse },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}

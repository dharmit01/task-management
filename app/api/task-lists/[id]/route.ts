import { isManagerOrAdmin, requireAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Task from "@/models/Task";
import TaskList from "@/models/TaskList";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateTaskListSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color (e.g. #3b82f6)")
    .optional(),
});

// GET /api/task-lists/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) return authResult.response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const taskList = await TaskList.findById(id).populate(
      "createdBy",
      "name email",
    );
    if (!taskList) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, taskList }, { status: 200 });
  } catch (error) {
    console.error("Get task list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 },
    );
  }
}

// PATCH /api/task-lists/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) return authResult.response;

  if (!isManagerOrAdmin(authResult.user)) {
    return NextResponse.json(
      { error: "Admin or Manager access required" },
      { status: 403 },
    );
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validationResult = updateTaskListSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    await connectDB();

    // Duplicate name check (excluding self)
    if (validationResult.data.name) {
      const existing = await TaskList.findOne({
        name: validationResult.data.name,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A company with this name already exists" },
          { status: 400 },
        );
      }
    }

    const updated = await TaskList.findByIdAndUpdate(
      id,
      { $set: validationResult.data },
      { new: true, runValidators: true },
    ).populate("createdBy", "name email");

    if (!updated) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, taskList: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update task list error:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 },
    );
  }
}

// DELETE /api/task-lists/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) return authResult.response;

  if (!isManagerOrAdmin(authResult.user)) {
    return NextResponse.json(
      { error: "Admin or Manager access required" },
      { status: 403 },
    );
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
  }

  try {
    await connectDB();

    // Block deletion if tasks still reference this company
    const taskCount = await Task.countDocuments({
      taskList: new Types.ObjectId(id),
    });
    if (taskCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete this company — it still has ${taskCount} task${taskCount === 1 ? "" : "s"}. Reassign or delete those tasks first.`,
          taskCount,
        },
        { status: 400 },
      );
    }

    const deleted = await TaskList.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Company deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete task list error:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 },
    );
  }
}

import {
  isAdmin,
  isManager,
  requireAdmin,
  requireAuth,
  requireManagerOrAdmin,
} from "@/lib/auth";
import connectDB from "@/lib/db";
import { getTeamMembers, isInTeam } from "@/lib/team-utils";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  role: z.enum(["Admin", "Manager", "Member"]).optional(),
  annualLeaveBalance: z
    .number()
    .min(0, "Leave balance cannot be negative")
    .optional(),
  managerId: z.string().nullable().optional(),
});

const updateLeaveBalanceSchema = z.object({
  annualLeaveBalance: z.number().min(0, "Leave balance cannot be negative"),
});

// GET /api/users/[id] - Get specific user (Authenticated users can view own profile, admins can view any)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    await connectDB();

    // Check if user is accessing their own profile, is an admin, or is a manager viewing team member
    const requestingUserId = authResult.user._id.toString();
    const isAdminUser = isAdmin(authResult.user);
    const isManagerUser = isManager(authResult.user);

    let hasAccess = id === requestingUserId || isAdminUser;

    // Managers can view their team members' profiles
    if (isManagerUser && !hasAccess) {
      hasAccess = await isInTeam(authResult.user._id, id);
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const user = await User.findById(id)
      .select("-password")
      .populate("managerId", "name username email");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const teamMembers =
      isAdminUser && user.role === "Manager"
        ? await getTeamMembers(user._id, { includeInactive: true })
        : undefined;

    return NextResponse.json(
      { success: true, user, ...(teamMembers ? { teamMembers } : {}) },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

// PATCH /api/users/[id] - Update user (Admin for all fields, Manager for leave balance only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireManagerOrAdmin(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const targetUser = await User.findById(id);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdminUser = isAdmin(authResult.user);
    const isManagerUser = isManager(authResult.user);

    // Managers can only update leave balance for their team members
    if (isManagerUser && !isAdminUser) {
      // Check if target user is in manager's team
      const isTeamMember = await isInTeam(authResult.user._id, id);

      if (!isTeamMember) {
        return NextResponse.json(
          { error: "You can only update leave balance for your team members" },
          { status: 403 },
        );
      }

      // Validate that manager is only updating leave balance
      const leaveBalanceValidation = updateLeaveBalanceSchema.safeParse(body);
      if (!leaveBalanceValidation.success) {
        return NextResponse.json(
          {
            error: "Managers can only update leave balance",
            details: leaveBalanceValidation.error.issues,
          },
          { status: 400 },
        );
      }

      // Check that only leave balance is being updated
      const keys = Object.keys(body);
      if (keys.length !== 1 || keys[0] !== "annualLeaveBalance") {
        return NextResponse.json(
          { error: "Managers can only update the annual leave balance field" },
          { status: 403 },
        );
      }

      // Update leave balance only
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: { annualLeaveBalance: body.annualLeaveBalance } },
        { new: true, runValidators: true },
      )
        .select("-password")
        .populate("managerId", "name username email");

      return NextResponse.json(
        { success: true, user: updatedUser },
        { status: 200 },
      );
    }

    // Admin can update all fields
    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    // Validate managerId if provided
    if (validationResult.data.managerId !== undefined) {
      if (validationResult.data.managerId === "") {
        // Allow clearing managerId
        validationResult.data.managerId = null;
      } else {
        const targetRole = validationResult.data.role || targetUser.role;
        if (targetRole !== "Member") {
          return NextResponse.json(
            { error: "Only Members can be assigned to a Manager" },
            { status: 400 },
          );
        }
        const manager = await User.findById(validationResult.data.managerId);
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
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: validationResult.data },
      { new: true, runValidators: true },
    )
      .select("-password")
      .populate("managerId", "name username email");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, user: updatedUser },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

// DELETE /api/users/[id] - Delete user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    await connectDB();

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "User deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}

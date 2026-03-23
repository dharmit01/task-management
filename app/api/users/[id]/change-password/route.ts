import { isAdmin, isManager, requireManagerOrAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import { isInTeam } from "@/lib/team-utils";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// POST /api/users/[id]/change-password
// Admins can change password for any Manager or Member.
// Managers can only change password for members in their team.
export async function POST(
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

    const validationResult = changePasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const { newPassword } = validationResult.data;

    await connectDB();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const requestingUser = authResult.user;
    const adminUser = isAdmin(requestingUser);
    const managerUser = isManager(requestingUser);

    if (adminUser) {
      // Admins can change password for Managers and Members only
      if (targetUser.role === "Admin") {
        return NextResponse.json(
          { error: "Admins cannot change the password of another Admin" },
          { status: 403 },
        );
      }
    } else if (managerUser) {
      // Managers can only change password for Members in their team
      if (targetUser.role !== "Member") {
        return NextResponse.json(
          {
            error: "Managers can only change passwords for their team members",
          },
          { status: 403 },
        );
      }
      const inTeam = await isInTeam(requestingUser._id, id);
      if (!inTeam) {
        return NextResponse.json(
          { error: "You can only change passwords for members in your team" },
          { status: 403 },
        );
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(id, { $set: { password: hashedPassword } });

    return NextResponse.json(
      { success: true, message: "Password changed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Change user password error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
}

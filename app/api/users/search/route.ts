import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

// GET /api/users/search?search=... - Search users by name/username/email for authenticated users
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    await connectDB();

    const url = new URL(request.url);
    const q = (url.searchParams.get("search") || "").trim();

    if (!q) {
      return NextResponse.json({ success: true, users: [] }, { status: 200 });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const users = await User.find(
      {
        $or: [{ name: regex }, { username: regex }, { email: regex }],
        isActive: true,
      },
      { password: 0 },
    )
      .limit(10)
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 },
    );
  }
}

import User, { IUser } from "@/models/User";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import connectDB from "./db";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error(
    "Please define the JWT_SECRET environment variable inside .env.local",
  );
}

export interface JWTPayload {
  userId: string;
  username: string;
  email?: string;
  role: "Admin" | "Manager" | "Member";
}

export interface AuthenticatedRequest extends NextRequest {
  user?: IUser;
  userId?: string;
}

/**
 * Verify JWT token and extract user information
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Extract and verify token from request headers
 */
export async function authenticateRequest(
  request: NextRequest,
): Promise<{ user: IUser | null; error: string | null }> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, error: "No token provided" };
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return { user: null, error: "Invalid or expired token" };
    }

    await connectDB();
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return { user: null, error: "User not found or inactive" };
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error: "Authentication failed" };
  }
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: IUser | null): boolean {
  return user?.role === "Admin";
}

/**
 * Check if user has manager role
 */
export function isManager(user: IUser | null): boolean {
  return user?.role === "Manager";
}

/**
 * Check if user has admin or manager role
 */
export function isManagerOrAdmin(user: IUser | null): boolean {
  return user?.role === "Admin" || user?.role === "Manager";
}

/**
 * Middleware helper to ensure user is authenticated
 */
export async function requireAuth(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);

  if (error || !user) {
    return {
      authenticated: false as const,
      user: null,
      response: Response.json(
        { error: error || "Authentication required" },
        { status: 401 },
      ),
    };
  }

  return { authenticated: true as const, user };
}

/**
 * Middleware helper to ensure user is admin
 */
export async function requireAdmin(request: NextRequest) {
  const authResult = await requireAuth(request);

  if (!authResult.authenticated) {
    return authResult;
  }

  if (!isAdmin(authResult.user)) {
    return {
      authenticated: false as const,
      user: null,
      response: Response.json(
        { error: "Admin access required" },
        { status: 403 },
      ),
    };
  }

  return authResult;
}

/**
 * Middleware helper to ensure user is admin or manager
 */
export async function requireManagerOrAdmin(request: NextRequest) {
  const authResult = await requireAuth(request);

  if (!authResult.authenticated) {
    return authResult;
  }

  if (!isManagerOrAdmin(authResult.user)) {
    return {
      authenticated: false as const,
      user: null,
      response: Response.json(
        { error: "Manager or Admin access required" },
        { status: 403 },
      ),
    };
  }

  return authResult;
}

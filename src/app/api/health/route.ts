import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/database/connection";

/**
 * GET /api/health
 *
 * Public liveness + readiness check. Returns 200 when the app is up and
 * the database connection is live, 503 otherwise.
 *
 * Use this as the target for uptime monitors (UptimeRobot, Better Uptime,
 * Vercel health checks). Add /api/health to isPublicRoute in middleware.ts.
 *
 * Response shape:
 *   { status: "ok" | "error", db: "connected" | "unreachable" }
 *
 * Deliberately minimal — never expose internal version strings, env names,
 * or stack traces in a public endpoint.
 */
export async function GET() {
  try {
    await connectToDatabase();

    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState !== 1) {
      throw new Error("DB not ready");
    }

    return NextResponse.json({ status: "ok", db: "connected" });
  } catch {
    return NextResponse.json({ status: "error", db: "unreachable" }, { status: 503 });
  }
}
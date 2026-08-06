import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/database/connection";

export async function GET() {
  try {
    await connectToDatabase();
    if (mongoose.connection.readyState !== 1) throw new Error("DB not ready");
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch {
    return NextResponse.json({ status: "error", db: "unreachable" }, { status: 503 });
  }
}

// UptimeRobot and most uptime monitors send HEAD requests — Next.js
// doesn't auto-derive HEAD from GET for route handlers, so it must be
// declared explicitly.
export async function HEAD() {
  try {
    await connectToDatabase();
    if (mongoose.connection.readyState !== 1) throw new Error("DB not ready");
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
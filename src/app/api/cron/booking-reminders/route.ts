import { NextResponse } from "next/server";
import { sendBookingReminders } from "@/jobs/booking-reminders";
import { logger } from "@/lib/logging/logger";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendBookingReminders();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error("booking-reminders cron failed", { error: String(error) });
    return NextResponse.json({ success: false, error: "Job failed" }, { status: 500 });
  }
}

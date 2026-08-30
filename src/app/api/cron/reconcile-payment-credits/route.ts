import { NextResponse } from "next/server";
import { reconcilePaymentCredits } from "@/jobs/reconcile-payment-credits";
import { logger } from "@/lib/logging/logger";
import { verifyCronSecret } from "@/lib/security/verifyCronSecret";

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await reconcilePaymentCredits();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error("reconcile-payment-credits cron failed", { error: String(error) });
    return NextResponse.json({ success: false, error: "Job failed" }, { status: 500 });
  }
}

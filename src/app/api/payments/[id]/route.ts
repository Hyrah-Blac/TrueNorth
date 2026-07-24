import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import User from "@/database/models/User";
import { requireAuth } from "@/middleware/auth";
import { ROLES } from "@/database/constants/roles";
import { successResponse, handleApiError } from "@/lib/api/response";
import { NotFoundError, ForbiddenError } from "@/lib/errors/AppError";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await connectToDatabase();

    const payment = await Payment.findById(id).populate("booking");
    if (!payment) throw new NotFoundError("Payment not found");

    if (session.role !== ROLES.ADMIN) {
      const dbUser = await User.findOne({ clerkId: session.clerkId }).select("_id");
      if (String(payment.customer) !== String(dbUser?._id)) {
        throw new ForbiddenError("You do not have access to this payment");
      }
    }

    return successResponse(payment);
  } catch (error) {
    return handleApiError(error, "GET /api/payments/[id]");
  }
}

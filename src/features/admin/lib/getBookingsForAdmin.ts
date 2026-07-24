import "server-only";
import connectToDatabase from "@/database/connection";
import Booking from "@/database/models/Booking";
import { requireAdmin } from "@/middleware/admin";
import { NotFoundError } from "@/lib/errors/AppError";
import type { IBooking } from "@/types/booking";
import type { BookingStatus } from "@/database/constants/booking-status";

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export async function getBookingsForAdmin(status?: BookingStatus): Promise<IBooking[]> {
  await requireAdmin();
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const bookings = await Booking.find(filter)
    .populate("aircraft", "name slug category")
    .populate("customer", "firstName lastName email phone")
    .sort({ createdAt: -1 });

  return serialize<IBooking[]>(bookings);
}

export async function getBookingForAdmin(bookingId: string): Promise<IBooking> {
  await requireAdmin();
  await connectToDatabase();

  const booking = await Booking.findById(bookingId)
    .populate("aircraft")
    .populate("customer", "firstName lastName email phone")
    .populate("quote");

  if (!booking) throw new NotFoundError("Booking not found");

  return serialize<IBooking>(booking);
}

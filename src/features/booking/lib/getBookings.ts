import "server-only";
import connectToDatabase from "@/database/connection";
import Booking from "@/database/models/Booking";
import "@/database/models/Aircraft"; // ensure Aircraft schema is registered before any populate("aircraft") runs
import "@/database/models/Quote"; // ensure Quote schema is registered before any populate("quote") runs
import { getCurrentUserOrThrow } from "@/middleware/auth";
import { NotFoundError, ForbiddenError } from "@/lib/errors/AppError";
import type { IBooking } from "@/types/booking";
import type { BookingStatus } from "@/database/constants/booking-status";

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export async function getMyBookings(status?: BookingStatus): Promise<IBooking[]> {
  const user = await getCurrentUserOrThrow();
  await connectToDatabase();

  const filter: Record<string, unknown> = { customer: user._id };
  if (status) filter.status = status;

  const bookings = await Booking.find(filter)
    .populate("aircraft", "name slug category heroImage")
    .sort({ createdAt: -1 });

  return serialize<IBooking[]>(bookings);
}

export async function getMyBookingById(bookingId: string): Promise<IBooking> {
  const user = await getCurrentUserOrThrow();
  await connectToDatabase();

  const booking = await Booking.findById(bookingId).populate("aircraft").populate("quote");
  if (!booking) throw new NotFoundError("Booking not found");

  if (String(booking.customer) !== String(user._id)) {
    throw new ForbiddenError("You do not have access to this booking");
  }

  return serialize<IBooking>(booking);
}
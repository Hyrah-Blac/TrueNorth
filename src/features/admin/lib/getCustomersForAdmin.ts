import "server-only";
import connectToDatabase from "@/database/connection";
import User from "@/database/models/User";
import Booking from "@/database/models/Booking";
import Quote from "@/database/models/Quote";
import { requireAdmin } from "@/middleware/admin";
import { NotFoundError } from "@/lib/errors/AppError";
import { ROLES } from "@/database/constants/roles";
import type { IUser } from "@/types/user";
import type { IBooking } from "@/types/booking";
import type { IQuote } from "@/types/quote";

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export async function getCustomersForAdmin(search?: string): Promise<IUser[]> {
  await requireAdmin();
  await connectToDatabase();

  const filter: Record<string, unknown> = { role: ROLES.CUSTOMER };
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(filter).sort({ createdAt: -1 });
  return serialize<IUser[]>(users);
}

export interface CustomerDetail {
  user: IUser;
  bookings: IBooking[];
  quotes: IQuote[];
}

export async function getCustomerForAdmin(userId: string): Promise<CustomerDetail> {
  await requireAdmin();
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("Customer not found");

  const [bookings, quotes] = await Promise.all([
    Booking.find({ customer: user._id }).populate("aircraft", "name category").sort({ createdAt: -1 }).limit(10),
    Quote.find({ customer: user._id }).sort({ createdAt: -1 }).limit(10),
  ]);

  return {
    user: serialize<IUser>(user),
    bookings: serialize<IBooking[]>(bookings),
    quotes: serialize<IQuote[]>(quotes),
  };
}

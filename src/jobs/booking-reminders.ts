import "server-only";
import connectToDatabase from "@/database/connection";
import Booking from "@/database/models/Booking";
import User from "@/database/models/User";
import Aircraft from "@/database/models/Aircraft";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";
import { sendEmail } from "@/lib/api/resend";
import { formatDate } from "@/utils/date";
import { siteConfig } from "@/lib/config/site";
import BookingReminder from "@/emails/BookingReminder";
import { logger } from "@/lib/logging/logger";

/**
 * Sends a reminder for every confirmed booking departing within the
 * next 24-48 hours that hasn't already received one. Intended to run
 * once daily via a Vercel Cron job hitting
 * /api/cron/booking-reminders — see vercel.json.
 */
export async function sendBookingReminders(): Promise<{ sent: number; failed: number }> {
  await connectToDatabase();

  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() + 24);
  const windowEnd = new Date();
  windowEnd.setHours(windowEnd.getHours() + 48);

  const bookings = await Booking.find({
    status: BOOKING_STATUSES.CONFIRMED,
    departureDate: { $gte: windowStart, $lte: windowEnd },
    reminderSentAt: { $exists: false },
  });

  let sent = 0;
  let failed = 0;

  for (const booking of bookings) {
    try {
      const [customer, aircraft] = await Promise.all([
        User.findById(booking.customer).select("firstName email"),
        Aircraft.findById(booking.aircraft).select("name"),
      ]);

      if (!customer) {
        failed += 1;
        continue;
      }

      await sendEmail({
        to: customer.email,
        subject: `Reminder: your charter departs soon — ${booking.bookingNumber}`,
        react: BookingReminder({
          customerName: customer.firstName,
          bookingNumber: booking.bookingNumber,
          aircraftName: aircraft?.name ?? "Aircraft",
          departureAirportCode: booking.departureAirportCode,
          destinationAirportCode: booking.destinationAirportCode,
          departureDate: formatDate(booking.departureDate),
          dashboardUrl: `${siteConfig.url}/dashboard/bookings/${booking._id}`,
        }),
      });

      booking.reminderSentAt = new Date();
      await booking.save();
      sent += 1;
    } catch (error) {
      failed += 1;
      logger.error("Failed to send booking reminder", { bookingId: String(booking._id), error: String(error) });
    }
  }

  logger.info("Booking reminder job complete", { sent, failed, checked: bookings.length });
  return { sent, failed };
}

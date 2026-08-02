import "server-only";
import connectToDatabase from "@/database/connection";
import Quote, { type QuoteDocument } from "@/database/models/Quote";
import { getCurrentDbUser } from "@/middleware/auth";
import { sanitizePlainText } from "@/utils/validators";
import { sendEmail, getAdminNotificationEmail } from "@/lib/api/resend";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings, toEmailContact } from "@/lib/config/siteSettings";
import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import AdminNewQuote from "@/emails/AdminNewQuote";
import type { CreateQuoteInput } from "../schemas/quote.schema";

/**
 * Creates a Quote from validated input, auto-linking the signed-in
 * customer's account when one exists. Charter requests can be
 * submitted signed-out (the public form) or signed-in (attaches to
 * the customer's dashboard automatically) — both paths call this.
 *
 * Uses getCurrentDbUser() (not a plain User.findOne) so that a
 * signed-in customer who hasn't triggered the Mongo profile sync yet
 * (e.g. submitting a request right after signup, before ever visiting
 * /dashboard) gets self-healed on the spot instead of silently having
 * their quote created with no customer link at all.
 */
export async function createQuoteFromInput(data: CreateQuoteInput): Promise<QuoteDocument> {
  await connectToDatabase();

  const dbUser = await getCurrentDbUser();

  const quote = await Quote.create({
    ...data,
    contactInfo: {
      ...data.contactInfo,
      fullName: sanitizePlainText(data.contactInfo.fullName),
      company: data.contactInfo.company ? sanitizePlainText(data.contactInfo.company) : undefined,
    },
    specialRequests: data.specialRequests ? sanitizePlainText(data.specialRequests) : undefined,
    customer: dbUser?._id,
  });

  // Fetch settings so the admin notification email footer reflects
  // whatever is configured in /admin/settings rather than falling back
  // to the hardcoded DEFAULT_CONTACT in EmailLayout.
  const settings = await getSiteSettings();

  await sendEmail({
    to: getAdminNotificationEmail(),
    subject: `New charter request: ${quote.quoteNumber}`,
    react: AdminNewQuote({
      quoteNumber: quote.quoteNumber,
      contactName: quote.contactInfo.fullName,
      contactEmail: quote.contactInfo.email,
      missionType: MISSION_TYPE_LABELS[quote.missionType],
      departureAirportCode: quote.departureAirportCode,
      destinationAirportCode: quote.destinationAirportCode,
      departureDate: quote.departureDate.toDateString(),
      adminUrl: `${siteConfig.url}/admin/quotes/${quote._id}`,
      contact: toEmailContact(settings),
    }),
  });

  return quote;
}

import "server-only";
import connectToDatabase from "@/database/connection";
import Quote, { type QuoteDocument } from "@/database/models/Quote";
import User from "@/database/models/User";
import { sanitizePlainText } from "@/utils/validators";
import { sendEmail, getAdminNotificationEmail } from "@/lib/api/resend";
import { siteConfig } from "@/lib/config/site";
import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import AdminNewQuote from "@/emails/AdminNewQuote";
import type { CreateQuoteInput } from "../schemas/quote.schema";

/**
 * Creates a Quote from validated input, auto-linking the signed-in
 * customer's account when one exists. Charter requests can be
 * submitted signed-out (the public form) or signed-in (attaches to
 * the customer's dashboard automatically) — both paths call this.
 */
export async function createQuoteFromInput(
  data: CreateQuoteInput,
  clerkId: string | null
): Promise<QuoteDocument> {
  await connectToDatabase();

  const dbUser = clerkId ? await User.findOne({ clerkId }).select("_id") : null;

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
    }),
  });

  return quote;
}

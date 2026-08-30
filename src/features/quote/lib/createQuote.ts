import "server-only";
import connectToDatabase from "@/database/connection";
import Quote, { type QuoteDocument } from "@/database/models/Quote";
import { getCurrentDbUser } from "@/middleware/auth";
import { sanitizePlainText } from "@/utils/validators";
import { sendEmail, getAdminNotificationEmail } from "@/lib/api/resend";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings, toEmailContact } from "@/lib/config/siteSettings";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";
import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import { quoteAttachmentFolderFor, verifyQuoteAttachmentOwnership } from "@/lib/api/cloudinary";
import { logger } from "@/lib/logging/logger";
import AdminNewQuote from "@/emails/AdminNewQuote";
import type { CreateQuoteInput } from "../schemas/quote.schema";

export interface RejectedQuoteAttachment {
  fileName: string;
  code: "ATTACHMENT_INVALID";
}

export interface CreateQuoteResult {
  quote: QuoteDocument;
  /**
   * HARDENING — previously, an attachment that failed ownership/size/
   * type verification was simply dropped with no signal to the caller
   * at all: the quote was created successfully and the customer had
   * no way to know one of their files never actually attached. This
   * surfaces which ones were rejected (by file name only — never
   * Cloudinary internals like the public ID, folder path, or the
   * specific check that failed, which would leak infrastructure
   * detail for no benefit to the customer) so the UI can tell them
   * "X wasn't attached, please try again" instead of silently
   * succeeding with fewer attachments than they submitted.
   */
  rejectedAttachments: RejectedQuoteAttachment[];
}

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
export async function createQuoteFromInput(data: CreateQuoteInput): Promise<CreateQuoteResult> {
  await connectToDatabase();

  const dbUser = await getCurrentDbUser();

  // FIX 3/4: never trust the client-supplied attachments array as-is.
  // /api/upload/documents only ever hands out signatures scoped to
  // the current signed-in user's own Cloudinary folder (see
  // quoteAttachmentFolderFor), so:
  //  - A signed-out submission couldn't have obtained a valid
  //    signature at all — any attachments it claims are dropped
  //    outright rather than trusted.
  //  - A signed-in submission's attachments are individually verified
  //    against Cloudinary's own record: the resource must exist, live
  //    in this user's folder, match the claimed resource type, and be
  //    within the platform's size limit. Anything that fails any of
  //    those checks is dropped from the quote — not trusted, but also
  //    not a hard failure of the whole submission (a tampered/expired
  //    attachment shouldn't block an otherwise valid charter request)
  //    — and reported back via rejectedAttachments (see
  //    CreateQuoteResult) so the caller can tell the customer.
  const verificationResults = dbUser
    ? await Promise.all(
        data.attachments.map(async (attachment) => {
          const verified = await verifyQuoteAttachmentOwnership(
            attachment.publicId,
            attachment.resourceType,
            quoteAttachmentFolderFor(dbUser.clerkId)
          );
          return { attachment, verified };
        })
      )
    : data.attachments.map((attachment) => ({ attachment, verified: null }));

  const verifiedAttachments = verificationResults
    .filter((entry) => entry.verified !== null)
    .map((entry) => entry.attachment);

  const rejectedAttachments: RejectedQuoteAttachment[] = verificationResults
    .filter((entry) => entry.verified === null)
    .map((entry) => ({ fileName: entry.attachment.fileName, code: "ATTACHMENT_INVALID" as const }));

  if (rejectedAttachments.length > 0) {
    logger.warn("Dropped unverifiable quote attachment(s) at submission", {
      claimed: data.attachments.length,
      verified: verifiedAttachments.length,
      rejected: rejectedAttachments.length,
      signedIn: Boolean(dbUser),
    });
  }

  const quote = await Quote.create({
    ...data,
    attachments: verifiedAttachments,
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
  const airportNames = await getAirportNamesByCodes([quote.departureAirportCode, quote.destinationAirportCode]);

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
      departureAirportName: airportNames[quote.departureAirportCode.toUpperCase()]?.city,
      destinationAirportName: airportNames[quote.destinationAirportCode.toUpperCase()]?.city,
      departureDate: quote.departureDate.toDateString(),
      adminUrl: `${siteConfig.url}/admin/quotes/${quote._id}`,
      contact: toEmailContact(settings),
    }),
  });

  return { quote, rejectedAttachments };
}

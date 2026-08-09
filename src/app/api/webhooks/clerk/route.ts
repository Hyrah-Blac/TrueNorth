import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import connectToDatabase from "@/database/connection";
import User from "@/database/models/User";
import Quote from "@/database/models/Quote";
import { ROLES } from "@/database/constants/roles";
import { logger } from "@/lib/logging/logger";

export async function POST(req: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!signingSecret) {
    logger.error("CLERK_WEBHOOK_SIGNING_SECRET is not configured");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  const webhook = new Webhook(signingSecret);

  let event: WebhookEvent;

  try {
    event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    logger.error("Clerk webhook signature verification failed", { error: String(error) });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await connectToDatabase();

    switch (event.type) {
      case "user.created": {
        const data = event.data;
        const primaryEmail = data.email_addresses.find(
          (email) => email.id === data.primary_email_address_id
        )?.email_address;

        if (!primaryEmail) {
          logger.warn("user.created event missing a primary email, skipping sync", {
            clerkId: data.id,
          });
          break;
        }

        // Match by clerkId OR email. A doc can already exist with this
        // email (earlier signup attempt, seed data, an account recreated
        // in Clerk, etc.) under a different clerkId — matching on clerkId
        // alone would miss it and the upsert's insert would then collide
        // with the unique index on `email` (E11000), silently failing the
        // whole sync. Matching on either field re-attaches the existing
        // record to the new clerkId instead of trying to insert a dupe.
        //
        // includeDeleted: true is required here too — user.deleted now
        // hard-deletes, so this mainly guards against any legacy row
        // that was soft-deleted before that change shipped. Without it,
        // that old row is invisible to this query, the upsert tries to
        // insert a fresh doc with the same email, and collides with the
        // unique index on the old soft-deleted one (E11000). We
        // explicitly reset isDeleted/deletedAt so that case revives the
        // old record instead of leaving it stuck deleted forever.
        await User.findOneAndUpdate(
          { $or: [{ clerkId: data.id }, { email: primaryEmail }], includeDeleted: true },
          {
            clerkId: data.id,
            email: primaryEmail,
            firstName: data.first_name || "Customer",
            lastName: data.last_name || "",
            avatarUrl: data.image_url,
            role: ROLES.CUSTOMER,
            isActive: true,
            isDeleted: false,
            deletedAt: null,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        logger.info("User synced from Clerk (created)", { clerkId: data.id });
        break;
      }

      case "user.updated": {
        const data = event.data;
        const primaryEmail = data.email_addresses.find(
          (email) => email.id === data.primary_email_address_id
        )?.email_address;

        const update: Record<string, unknown> = {
          firstName: data.first_name || "Customer",
          lastName: data.last_name || "",
        };

        if (primaryEmail) {
          update.email = primaryEmail;
        }

        // Only overwrite avatarUrl with Clerk's image if the user hasn't
        // uploaded their own avatar (avatarPublicId unset). Otherwise a
        // routine Clerk profile sync would silently clobber a photo the
        // user picked on our own profile page. A single conditional
        // update (rather than fetch-then-save) keeps this race-safe
        // against a concurrent avatar upload.
        await User.findOneAndUpdate(
          { clerkId: data.id, avatarPublicId: { $exists: false } },
          { ...update, avatarUrl: data.image_url }
        );
        await User.findOneAndUpdate(
          { clerkId: data.id, avatarPublicId: { $exists: true } },
          update
        );
        logger.info("User synced from Clerk (updated)", { clerkId: data.id });
        break;
      }

      case "user.deleted": {
        const data = event.data;

        if (!data.id) {
          logger.warn("user.deleted event missing an id, skipping");
          break;
        }

        const user = await User.findOne({ clerkId: data.id }).select("_id");

        if (!user) {
          logger.warn("user.deleted event received but no matching User doc found", {
            clerkId: data.id,
          });
          break;
        }

        // Quotes are pre-booking inquiries tied to this customer's
        // profile — per product decision, they're deleted along with
        // the account rather than kept around as orphaned records.
        // Note: if a quote was already converted into a booking, the
        // resulting Booking's `quote` field becomes a dangling
        // reference — nothing currently renders that populated field,
        // so this is safe, but flagging it here in case that changes.
        //
        // Bookings and Payments are deliberately left untouched. Those
        // are financial/operational records (charter bookings, payment
        // transactions) that the business needs to retain for
        // accounting, tax, and dispute-resolution purposes regardless
        // of whether the customer's account still exists. Their
        // `customer` field becomes a dangling ObjectId reference after
        // this runs — `.populate("customer")` on those models resolves
        // to null going forward. Admin UI reading
        // `booking.customer.firstName` etc. after population handles
        // that null case (see AdminBookingRow, AdminPaymentRow, and
        // their corresponding detail pages).
        const quoteResult = await Quote.deleteMany({ customer: user._id });

        // Hard delete, not soft delete: this permanently removes the
        // User document (name, email, phone, company, avatar) from
        // Mongo. This is intentional per product decision — full
        // erasure of the account/profile itself.
        await User.deleteOne({ _id: user._id });

        logger.info("User hard-deleted via Clerk webhook", {
          clerkId: data.id,
          quotesDeleted: quoteResult.deletedCount,
        });

        break;
      }

      default:
        logger.debug("Unhandled Clerk webhook event type", { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Error processing Clerk webhook", { error: String(error) });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
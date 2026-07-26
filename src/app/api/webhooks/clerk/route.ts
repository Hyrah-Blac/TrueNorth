import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import connectToDatabase from "@/database/connection";
import User from "@/database/models/User";
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
        await User.findOneAndUpdate(
          { $or: [{ clerkId: data.id }, { email: primaryEmail }] },
          {
            clerkId: data.id,
            email: primaryEmail,
            firstName: data.first_name || "Customer",
            lastName: data.last_name || "",
            avatarUrl: data.image_url,
            role: ROLES.CUSTOMER,
            isActive: true,
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
          avatarUrl: data.image_url,
        };

        if (primaryEmail) {
          update.email = primaryEmail;
        }

        await User.findOneAndUpdate({ clerkId: data.id }, update);
        logger.info("User synced from Clerk (updated)", { clerkId: data.id });
        break;
      }

      case "user.deleted": {
        const data = event.data;

        if (data.id) {
          const user = await User.findOne({ clerkId: data.id });
          if (user) {
            await user.softDelete();
            logger.info("User soft-deleted via Clerk webhook", { clerkId: data.id });
          }
        }
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
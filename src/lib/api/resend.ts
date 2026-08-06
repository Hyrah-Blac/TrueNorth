import "server-only";
import { Resend } from "resend";
import type { ReactElement } from "react";
import { logger } from "@/lib/logging/logger";
import { siteConfig } from "@/lib/config/site";
import { withRetry } from "./retry";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
    client = new Resend(apiKey);
  }
  return client;
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
}

/**
 * Sends a transactional email with up to 3 attempts on transient failures.
 * Callers should treat this as best-effort — email delivery must never
 * block or fail the underlying booking/payment/quote operation it's
 * notifying about. Wrap calls in try/catch rather than letting a Resend
 * outage break a payment confirmation.
 */
export async function sendEmail({ to, subject, react, replyTo }: SendEmailParams): Promise<void> {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!fromEmail) throw new Error("RESEND_FROM_EMAIL is not configured");

    const resend = getClient();

    await withRetry(
      async () => {
        const { error } = await resend.emails.send({
          from: `${siteConfig.name} <${fromEmail}>`,
          to,
          subject,
          react,
          replyTo,
        });

        if (error) {
          // Treat Resend's application-level errors as thrown so withRetry
          // can act on them, then catch at the outer level as before.
          throw new Error(JSON.stringify(error));
        }
      },
      { attempts: 3, baseDelayMs: 500, label: `email send (${subject})` }
    );
  } catch (error) {
    logger.error("Failed to send email after retries", { to, subject, error: String(error) });
  }
}

export function getAdminNotificationEmail(): string {
  return process.env.ADMIN_NOTIFICATION_EMAIL || siteConfig.email;
}
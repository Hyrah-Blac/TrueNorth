import "server-only";
import { Resend } from "resend";
import type { ReactElement } from "react";
import { logger } from "@/lib/logging/logger";
import { siteConfig } from "@/lib/config/site";

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
 * Sends a transactional email. Callers should treat this as
 * best-effort — email delivery must never block or fail the
 * underlying booking/payment/quote operation it's notifying about.
 * Wrap calls in try/catch (or just let this resolve/log internally)
 * rather than letting a Resend outage break a payment confirmation.
 */
export async function sendEmail({ to, subject, react, replyTo }: SendEmailParams): Promise<void> {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!fromEmail) throw new Error("RESEND_FROM_EMAIL is not configured");

    const resend = getClient();

    const { error } = await resend.emails.send({
      from: `${siteConfig.name} <${fromEmail}>`,
      to,
      subject,
      react,
      replyTo,
    });

    if (error) {
      logger.error("Resend email send failed", { to, subject, error: JSON.stringify(error) });
    }
  } catch (error) {
    logger.error("Failed to send email", { to, subject, error: String(error) });
  }
}

export function getAdminNotificationEmail(): string {
  return process.env.ADMIN_NOTIFICATION_EMAIL || siteConfig.email;
}

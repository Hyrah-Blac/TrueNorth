import "server-only";
import { logger } from "@/lib/logging/logger";

export type AuditAction =
  | "quote.approve"
  | "quote.reject"
  | "quote.customer_accept"
  | "quote.customer_decline"
  | "booking.cancel"
  | "booking.status_change"
  | "user.role_change"
  | "user.deactivate"
  | "user.activate"
  | "payment.mark_paid"
  | "payment.refund"
  | "aircraft.create"
  | "aircraft.update"
  | "aircraft.delete"
  | "knowledge_base.create"
  | "knowledge_base.update"
  | "knowledge_base.delete"
  | "settings.update"
  | "upload.document_signature"
  | "upload.aircraft_signature";

export interface AuditEvent {
  action: AuditAction;
  /** Clerk user ID of the admin/user performing the action. */
  actorClerkId: string;
  /** MongoDB ID of the resource being acted on (quote, booking, user…). */
  resourceId?: string;
  /** Human-readable resource type for log readability. */
  resourceType?: string;
  /** Any additional structured context (e.g. old/new values). */
  meta?: Record<string, unknown>;
}

/**
 * Writes a structured audit entry. Call this after a sensitive action
 * succeeds — not before, so partial failures don't produce ghost entries.
 *
 * All fields land in the same JSON log line as the application logger,
 * but with `type: "audit"` so you can filter them in Vercel Log Drains,
 * Datadog, or any other sink with a single query.
 */
export function auditLog(event: AuditEvent): void {
  logger.info("audit", {
    type: "audit",
    action: event.action,
    actorClerkId: event.actorClerkId,
    resourceId: event.resourceId,
    resourceType: event.resourceType,
    meta: event.meta,
  });
}
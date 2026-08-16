import type { TicketStatus } from "@/database/constants/ticket-status";
import type { IBooking } from "./booking";

export interface ITicket {
  _id: string;
  ticketNumber: string;
  booking: string | IBooking;
  customer: string;
  status: TicketStatus;

  issuedAt: string;
  cancelledAt?: string;
  invalidatedAt?: string;

  createdAt: string;
  updatedAt: string;
}

import type { BookingStatus } from "@/database/constants/booking-status";
import type { MissionType } from "@/database/constants/mission-type";
import type { IAircraft } from "./aircraft";

export interface IBookingTimelineEntry {
  status: BookingStatus;
  note?: string;
  changedBy?: string;
  changedAt: string;
}

export interface IBooking {
  _id: string;
  bookingNumber: string;
  quote?: string;
  customer: string;
  aircraft: string | IAircraft;

  passengerCount: number;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  returnDate?: string;
  isRoundTrip: boolean;
  missionType: MissionType;

  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;

  specialRequests?: string;
  status: BookingStatus;
  timeline: IBookingTimelineEntry[];

  modificationRequested: boolean;
  modificationNotes?: string;
  cancellationReason?: string;

  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;

  createdAt: string;
  updatedAt: string;
}

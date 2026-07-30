import type { QuoteStatus } from "@/database/constants/quote-status";
import type { MissionType } from "@/database/constants/mission-type";
import type { IAircraft } from "./aircraft";

export interface IQuoteContactInfo {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
}

export interface IQuoteReviewer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface IQuoteCustomer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface IQuoteAttachment {
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
}

export interface IQuote {
  _id: string;
  quoteNumber: string;
  customer?: string | IQuoteCustomer;
  contactInfo: IQuoteContactInfo;

  passengerCount: number;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  returnDate?: string;
  isRoundTrip: boolean;

  aircraftPreference?: string | IAircraft;
  missionType: MissionType;
  budgetRangeMin?: number;
  budgetRangeMax?: number;
  currency: string;

  specialRequests?: string;
  hasMedicalEquipment: boolean;
  medicalEquipmentDetails?: string;
  hasVipRequirements: boolean;
  vipRequirementsDetails?: string;
  hasCargo: boolean;
  cargoDetails?: string;
  hasPets: boolean;
  petsDetails?: string;
  hasDangerousGoods: boolean;
  dangerousGoodsDetails?: string;

  attachments: IQuoteAttachment[];

  status: QuoteStatus;
  adminNotes?: string;
  quotedAmount?: number;
  quotedCurrency?: string;
  validUntil?: string;
  rejectionReason?: string;
  reviewedBy?: string | IQuoteReviewer;
  reviewedAt?: string;
  convertedBooking?: string;

  createdAt: string;
  updatedAt: string;
}
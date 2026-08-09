import type { PaymentStatus, PaymentMethod } from "@/database/constants/payment-status";
import type { IBooking, IBookingCustomer } from "./booking";

export interface IMpesaDetails {
  phoneNumber?: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  resultCode?: number;
  resultDescription?: string;
}

export interface IPayment {
  _id: string;
  paymentNumber: string;
  booking: string | IBooking;
  customer: string | IBookingCustomer;

  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;

  mpesa: IMpesaDetails;

  receiptUrl?: string;
  failureReason?: string;
  refundedAmount?: number;
  refundReason?: string;

  createdAt: string;
  updatedAt: string;
}

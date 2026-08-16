import type { PaymentStatus, PaymentMethod, PaymentProvider } from "@/database/constants/payment-status";
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

export interface IPaystackAuthorizationDetails {
  authorizationCode?: string;
  last4?: string;
  cardType?: string;
  bank?: string;
  channel?: string;
  reusable?: boolean;
}

export interface IPaystackDetails {
  reference?: string;
  accessCode?: string;
  authorizationUrl?: string;
  transactionId?: number;
  channel?: string;
  gatewayResponse?: string;
  paidAt?: string;
  ipAddress?: string;
  authorization?: IPaystackAuthorizationDetails;
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
  provider: PaymentProvider;

  mpesa: IMpesaDetails;
  paystack: IPaystackDetails;

  receiptUrl?: string;
  failureReason?: string;
  refundedAmount?: number;
  refundReason?: string;

  createdAt: string;
  updatedAt: string;
}

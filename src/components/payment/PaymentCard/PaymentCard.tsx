import Link from "next/link";
import { Receipt as ReceiptIcon } from "lucide-react";
import { CustomerPaymentStatusBadge } from "./CustomerPaymentStatusBadge";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { IPayment } from "@/types/payment";

export function PaymentCard({ payment }: { payment: IPayment }) {
  const bookingNumber =
    typeof payment.booking === "object" && payment.booking !== null
      ? payment.booking.bookingNumber
      : undefined;

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 hover:border-sky-200">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-600">
          <ReceiptIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="spec-readout text-sm font-medium text-navy-900">{payment.paymentNumber}</p>
            <p className="spec-readout shrink-0 text-sm font-semibold text-navy-900">
              {formatCurrency(payment.amount, payment.currency)}
            </p>
          </div>
          {bookingNumber ? <p className="mt-0.5 text-xs text-slate-500">Booking {bookingNumber}</p> : null}
          <p className="mt-1 text-xs text-slate-500">{formatDateTime(payment.createdAt)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
        <CustomerPaymentStatusBadge status={payment.status} />
        {payment.status === "completed" ? (
          <Link
            href={`/dashboard/payments/${payment._id}`}
            className="text-xs font-medium uppercase tracking-wide text-sky-600 transition-colors hover:text-sky-700"
          >
            View receipt
          </Link>
        ) : null}
      </div>
    </div>
  );
}

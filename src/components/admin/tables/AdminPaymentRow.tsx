import Link from "next/link";
import { Receipt, ArrowUpRight } from "lucide-react";
import { PaymentStatusBadge } from "@/components/payment/PaymentCard/PaymentStatusBadge";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { IPayment } from "@/types/payment";

export function AdminPaymentRow({ payment }: { payment: IPayment }) {
  const customer =
    typeof payment.customer === "object" && payment.customer !== null
      ? (payment.customer as unknown as { firstName?: string; lastName?: string })
      : null;
  const bookingNumber = typeof payment.booking === "object" ? payment.booking.bookingNumber : undefined;

  return (
    <Link
      href={`/admin/payments/${payment._id}`}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 hover:border-sky-300 hover:shadow-lifted sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-600">
          <Receipt className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="spec-readout text-sm font-medium text-navy-900">{payment.paymentNumber}</p>
          <p className="mt-0.5 text-sm text-slate-600">
            {customer ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() : "—"}
            {bookingNumber ? ` · ${bookingNumber}` : ""}
          </p>
          <p className="mt-1 text-xs text-slate-500">{formatDateTime(payment.createdAt)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <p className="spec-readout text-sm font-semibold text-navy-900">
          {formatCurrency(payment.amount, payment.currency)}
        </p>
        <PaymentStatusBadge status={payment.status} />
        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
      </div>
    </Link>
  );
}

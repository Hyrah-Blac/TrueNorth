import Link from "next/link";
import { ArrowUpRight, AlertCircle } from "lucide-react";
import { CustomerPaymentStatusBadge } from "./CustomerPaymentStatusBadge";
import { PAYMENT_METHOD_META, PAYMENT_STATUS_ACCENT } from "./paymentMeta";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { IPayment } from "@/types/payment";

export function PaymentCard({ payment }: { payment: IPayment }) {
  const bookingNumber =
    typeof payment.booking === "object" && payment.booking !== null
      ? payment.booking.bookingNumber
      : undefined;
  const method = PAYMENT_METHOD_META[payment.method];
  const MethodIcon = method?.icon;

  return (
    <div className="relative flex flex-col gap-5 overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 hover:border-sky-200 hover:shadow-lifted">
      <span
        className={`absolute inset-y-0 left-0 w-[3px] ${PAYMENT_STATUS_ACCENT[payment.status]}`}
        aria-hidden="true"
      />
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-600 ring-1 ring-inset ring-sky-500/10">
          {MethodIcon ? <MethodIcon className="h-5 w-5" aria-hidden="true" /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="spec-readout text-sm font-semibold text-navy-900">{payment.paymentNumber}</p>
              <p className="mt-0.5 text-xs text-slate-400">{method?.label ?? payment.method}</p>
            </div>
            <p className="spec-readout shrink-0 text-[15px] font-semibold text-navy-900">
              {formatCurrency(payment.amount, payment.currency)}
            </p>
          </div>
          {bookingNumber ? <p className="mt-2 text-xs text-slate-500">Booking {bookingNumber}</p> : null}
          <p className="mt-1 text-xs text-slate-500">{formatDateTime(payment.createdAt)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <CustomerPaymentStatusBadge status={payment.status} />
          {payment.status === "failed" && payment.failureReason ? (
            <span title={payment.failureReason}>
              <AlertCircle className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
            </span>
          ) : null}
        </div>
        {payment.status === "completed" ? (
          <Link
            href={`/dashboard/payments/${payment._id}`}
            className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700 transition-all duration-200 hover:border-sky-400 hover:bg-sky-100"
          >
            Receipt
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Receipt, ArrowUpRight } from "lucide-react";
import { PaymentStatusBadge } from "@/components/payment/PaymentCard/PaymentStatusBadge";
import { PAYMENT_METHOD_META } from "@/components/payment/PaymentCard/paymentMeta";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { IPayment } from "@/types/payment";

export function AdminPaymentRow({ payment }: { payment: IPayment }) {
  const customer = typeof payment.customer === "object" && payment.customer !== null ? payment.customer : null;
  const booking = typeof payment.booking === "object" && payment.booking !== null ? payment.booking : null;
  const aircraftName = booking && typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;
  const method = PAYMENT_METHOD_META?.[payment.method];

  return (
    <Link
      href={`/admin/payments/${payment._id}`}
      className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 transition-all duration-300 hover:border-sky-200 sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Left — icon + identity */}
      <div className="flex items-center gap-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
          style={{
            background: "linear-gradient(135deg, rgb(219 229 247) 0%, rgb(189 205 241) 100%)",
            color: "rgb(30 58 128)",
            boxShadow: "0 1px 4px rgb(43 91 191 / 0.15)",
          }}
        >
          <Receipt className="h-5 w-5" aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <p className="spec-readout text-[11px] text-slate-400">{payment.paymentNumber}</p>
          <p className="mt-0.5 truncate font-editorial text-lg font-light text-navy-900 transition-colors group-hover:text-sky-700">
            {method?.label ?? payment.method}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            {customer ? (
              <span className="font-medium text-slate-600">
                {customer.firstName ?? ""} {customer.lastName ?? ""}
              </span>
            ) : null}
            {booking ? (
              <>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="spec-readout">{booking.bookingNumber}</span>
              </>
            ) : null}
            {aircraftName ? (
              <>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span>{aircraftName}</span>
              </>
            ) : null}
          </div>
          <p className="mt-0.5 spec-readout text-[10px] text-slate-400">{formatDateTime(payment.createdAt)}</p>
        </div>
      </div>

      {/* Right — amount + status + caret */}
      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <p className="spec-readout text-base font-semibold text-navy-900">
            {formatCurrency(payment.amount, payment.currency)}
          </p>
          {payment.mpesa?.mpesaReceiptNumber ? (
            <p className="spec-readout text-[10px] text-slate-400">{payment.mpesa.mpesaReceiptNumber}</p>
          ) : payment.paystack?.reference ? (
            <p className="spec-readout text-[10px] text-slate-400">{payment.paystack.reference}</p>
          ) : null}
        </div>
        <PaymentStatusBadge status={payment.status} />
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sky-500"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
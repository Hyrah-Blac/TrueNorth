import Link from "next/link";
import { ArrowUpRight, AlertCircle } from "lucide-react";
import { CustomerPaymentStatusBadge } from "./CustomerPaymentStatusBadge";
import { PAYMENT_METHOD_META, PAYMENT_STATUS_ACCENT } from "./paymentMeta";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { IPayment } from "@/types/payment";

/**
 * Premium, aviation-dashboard-style table for larger screens. PaymentCard
 * continues to handle the mobile (< md) view. Purely presentational — same
 * data, same links, same status values as before.
 */
export function PaymentsTable({ payments }: { payments: IPayment[] }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lifted md:block">
      <div className="h-[3px] bg-gradient-to-r from-sky-600 via-sky-400 to-champagne-500" aria-hidden="true" />

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70">
            <th scope="col" className="px-6 py-4 text-[11px] font-semibold uppercase tracking-widest2 text-slate-400">
              Payment
            </th>
            <th scope="col" className="px-6 py-4 text-[11px] font-semibold uppercase tracking-widest2 text-slate-400">
              Booking
            </th>
            <th scope="col" className="px-6 py-4 text-[11px] font-semibold uppercase tracking-widest2 text-slate-400">
              Date
            </th>
            <th scope="col" className="px-6 py-4 text-[11px] font-semibold uppercase tracking-widest2 text-slate-400">
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-widest2 text-slate-400"
            >
              Amount
            </th>
            <th scope="col" className="w-40 px-6 py-4" aria-hidden="true" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.map((payment) => {
            const bookingNumber =
              typeof payment.booking === "object" && payment.booking !== null
                ? payment.booking.bookingNumber
                : undefined;
            const method = PAYMENT_METHOD_META[payment.method];
            const MethodIcon = method?.icon;

            return (
              <tr key={payment._id} className="group relative transition-colors hover:bg-sky-500/[0.035]">
                <td className="relative px-6 py-5">
                  <span
                    className={`absolute inset-y-0 left-0 w-[3px] ${PAYMENT_STATUS_ACCENT[payment.status]}`}
                    aria-hidden="true"
                  />
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-600 ring-1 ring-inset ring-sky-500/10 transition-colors group-hover:bg-sky-100">
                      {MethodIcon ? <MethodIcon className="h-4 w-4" aria-hidden="true" /> : null}
                    </span>
                    <div className="min-w-0">
                      <p className="spec-readout text-sm font-semibold text-navy-900">{payment.paymentNumber}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{method?.label ?? payment.method}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">{bookingNumber ?? "—"}</td>
                <td className="px-6 py-5 text-sm text-slate-600">{formatDateTime(payment.createdAt)}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <CustomerPaymentStatusBadge status={payment.status} />
                    {payment.status === "failed" && payment.failureReason ? (
                      <span title={payment.failureReason}>
                        <AlertCircle className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <span className="spec-readout text-[15px] font-semibold text-navy-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  {payment.status === "completed" ? (
                    <Link
                      href={`/dashboard/payments/${payment._id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700 transition-all duration-200 hover:border-sky-400 hover:bg-sky-100 hover:shadow-sm"
                    >
                      Receipt
                      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

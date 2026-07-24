import Link from "next/link";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { IPayment } from "@/types/payment";

/**
 * Stripe-dashboard-style table for larger screens. PaymentCard continues
 * to handle the mobile (< md) view.
 */
export function PaymentsTable({ payments }: { payments: IPayment[] }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft md:block">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-widest2 text-slate-500">
            <th scope="col" className="px-6 py-4 font-medium">Payment</th>
            <th scope="col" className="px-6 py-4 font-medium">Booking</th>
            <th scope="col" className="px-6 py-4 font-medium">Date</th>
            <th scope="col" className="px-6 py-4 font-medium">Status</th>
            <th scope="col" className="px-6 py-4 text-right font-medium">Amount</th>
            <th scope="col" className="w-32 px-6 py-4" aria-hidden="true" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.map((payment) => {
            const bookingNumber =
              typeof payment.booking === "object" && payment.booking !== null
                ? payment.booking.bookingNumber
                : undefined;

            return (
              <tr key={payment._id} className="group transition-colors hover:bg-sky-500/[0.04]">
                <td className="px-6 py-4">
                  <span className="spec-readout text-sm font-medium text-navy-900">{payment.paymentNumber}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{bookingNumber ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDateTime(payment.createdAt)}</td>
                <td className="px-6 py-4">
                  <PaymentStatusBadge status={payment.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="spec-readout text-sm font-semibold text-navy-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {payment.status === "completed" ? (
                    <Link
                      href={`/dashboard/payments/${payment._id}`}
                      className="text-xs font-medium uppercase tracking-wide text-sky-600 transition-colors hover:text-sky-700"
                    >
                      View receipt
                    </Link>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

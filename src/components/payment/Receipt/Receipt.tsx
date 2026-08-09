"use client";

import { Printer, CheckCircle } from "@phosphor-icons/react";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { siteConfig } from "@/lib/config/site";
import type { IPayment } from "@/types/payment";

interface ReceiptProps {
  payment: IPayment;
  contactEmail?: string;
}

export function Receipt({ payment, contactEmail = siteConfig.email }: ReceiptProps) {
  const bookingNumber =
    typeof payment.booking === "object" && payment.booking !== null
      ? payment.booking.bookingNumber
      : undefined;

  const rows: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Amount paid", value: formatCurrency(payment.amount, payment.currency), highlight: true },
    { label: "Payment method", value: "M-Pesa" },
    { label: "M-Pesa receipt", value: payment.mpesa.mpesaReceiptNumber ?? "—" },
    { label: "Payment reference", value: payment.paymentNumber },
    ...(bookingNumber ? [{ label: "Booking reference", value: bookingNumber }] : []),
    {
      label: "Date & time",
      value: payment.mpesa.transactionDate
        ? formatDateTime(payment.mpesa.transactionDate)
        : formatDateTime(payment.createdAt),
    },
  ];

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-soft print:border-none print:shadow-none">
        {/* Header */}
        <div className="border-b border-slate-100 px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-editorial text-xl font-light text-navy-900">{siteConfig.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{contactEmail}</p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-sky-300 hover:text-sky-600 print:hidden"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              Print
            </button>
          </div>
        </div>

        {/* Confirmed status */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-green-800">Payment confirmed</p>
              <p className="text-xs text-green-600">Your payment has been received and applied to your booking.</p>
            </div>
          </div>
        </div>

        {/* Receipt rows */}
        <dl className="mx-8 divide-y divide-slate-100 border-t border-slate-100">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-4">
              <dt className="text-sm text-slate-500">{row.label}</dt>
              <dd
                className={`spec-readout text-sm font-medium ${
                  row.highlight ? "text-xl font-bold text-navy-900" : "text-navy-900"
                }`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100">
          <p className="text-center text-xs leading-relaxed text-slate-500">
            This receipt confirms payment received by {siteConfig.name}.{" "}
            <span className="block mt-0.5">Retain for your records.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

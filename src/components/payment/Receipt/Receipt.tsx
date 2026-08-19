"use client";

import { Download, CheckCircle } from "@phosphor-icons/react";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { siteConfig } from "@/lib/config/site";
import { PAYMENT_METHOD_META } from "@/components/payment/PaymentCard/paymentMeta";
import { PAYMENT_PROVIDERS } from "@/database/constants/payment-status";
import type { IPayment } from "@/types/payment";

interface ReceiptProps {
  payment: IPayment;
  companyName?: string;
  contactEmail?: string;
}

export function Receipt({ payment, companyName = siteConfig.name, contactEmail = siteConfig.email }: ReceiptProps) {
  const bookingNumber =
    typeof payment.booking === "object" && payment.booking !== null
      ? payment.booking.bookingNumber
      : undefined;

  const isPaystack = payment.provider === PAYMENT_PROVIDERS.PAYSTACK;
  const methodLabel = PAYMENT_METHOD_META[payment.method]?.label ?? payment.method;
  const providerReference = isPaystack ? payment.paystack.reference : payment.mpesa.mpesaReceiptNumber;
  const providerReferenceLabel = isPaystack ? "Payment reference (Paystack)" : "M-Pesa receipt";
  const transactionDate = isPaystack ? payment.paystack.paidAt : payment.mpesa.transactionDate;

  const rows: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Amount paid", value: formatCurrency(payment.amount, payment.currency), highlight: true },
    { label: "Payment method", value: methodLabel },
    { label: providerReferenceLabel, value: providerReference ?? "—" },
    { label: "Payment reference", value: payment.paymentNumber },
    ...(bookingNumber ? [{ label: "Booking reference", value: bookingNumber }] : []),
    {
      label: "Date & time",
      value: transactionDate ? formatDateTime(transactionDate) : formatDateTime(payment.createdAt),
    },
  ];

  return (
    <div className="mx-auto max-w-md">
      {/* The receipt can be printed from a page that still has the site
          header/footer around it (nav, "Request Charter" CTA, footer
          contact block, etc). None of that belongs on a printed receipt,
          so it's hidden globally in print mode here rather than requiring
          every page that renders <Receipt /> to remember to do it.

          Browsers strip background colors/gradients by default when
          printing — print-color-adjust: exact forces the blue/champagne
          accent bar and badge to actually show up on paper instead of
          silently vanishing. @page sets sane margins and break-inside:
          avoid keeps the card from being sliced across two pages. */}
      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0.6in;
          }
          header,
          footer {
            display: none !important;
          }
          html,
          body {
            background: #fff !important;
          }
          .receipt-card,
          .receipt-card * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .receipt-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="receipt-card overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-soft print:border-slate-200 print:shadow-none">
        {/* Header */}
        <div className="border-b border-navy-900/10 px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-editorial text-base font-light text-navy-900 sm:text-lg">{companyName}</p>
              <p className="mt-0.5 text-[0.6875rem] text-slate-500">{contactEmail}</p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-50 print:hidden"
            >
              <Download className="h-3 w-3" aria-hidden="true" />
              Download
            </button>
          </div>
        </div>

        {/* Confirmed status */}
        <div className="px-6 pb-4 pt-6 sm:px-8 sm:pt-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagne-50">
              <CheckCircle className="h-4 w-4 text-champagne-600" weight="light" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-navy-900 sm:text-sm">Payment confirmed</p>
              <p className="mt-0.5 text-[0.6875rem] text-slate-500">
                Your payment has been received and applied to your booking.
              </p>
            </div>
          </div>
        </div>

        {/* Receipt rows */}
        <dl className="mx-6 divide-y divide-navy-900/10 border-t border-navy-900/10 sm:mx-8">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-3.5 sm:py-4">
              <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">{row.label}</dt>
              <dd
                className={`font-editorial spec-readout text-right font-light text-navy-900 ${
                  row.highlight ? "text-lg font-semibold text-blue-700 sm:text-xl" : "text-xs sm:text-sm"
                }`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Footer */}
        <div className="border-t border-navy-900/10 bg-slate-50/60 px-6 py-5 sm:px-8 sm:py-6">
          <p className="text-center text-[0.6875rem] leading-relaxed text-slate-500">
            This receipt confirms payment received by {companyName}.{" "}
            <span className="mt-0.5 block">Retain for your records.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
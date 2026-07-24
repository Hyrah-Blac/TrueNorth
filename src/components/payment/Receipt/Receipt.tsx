import { Printer } from "lucide-react";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { siteConfig } from "@/lib/config/site";
import type { IPayment } from "@/types/payment";

export function Receipt({ payment }: { payment: IPayment }) {
  const bookingNumber =
    typeof payment.booking === "object" && payment.booking !== null
      ? payment.booking.bookingNumber
      : undefined;

  const rows: { label: string; value: string }[] = [
    { label: "Receipt number", value: payment.mpesa.mpesaReceiptNumber ?? "—" },
    { label: "Payment reference", value: payment.paymentNumber },
    ...(bookingNumber ? [{ label: "Booking reference", value: bookingNumber }] : []),
    { label: "Amount paid", value: formatCurrency(payment.amount, payment.currency) },
    { label: "Payment method", value: "M-Pesa" },
    {
      label: "Date & time",
      value: payment.mpesa.transactionDate
        ? formatDateTime(payment.mpesa.transactionDate)
        : formatDateTime(payment.createdAt),
    },
  ];

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-9 shadow-soft print:border-none print:shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-editorial text-xl italic text-navy-900">{siteConfig.name}</p>
          <p className="text-xs text-slate-500">{siteConfig.email}</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-600 print:hidden"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          Print
        </button>
      </div>

      <div className="mt-7">
        <InlineAlert tone="success">Payment confirmed</InlineAlert>
      </div>

      <dl className="mt-7 divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-3.5">
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd className="spec-readout text-sm font-medium text-navy-900">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-7 text-center text-xs text-slate-500">
        This receipt confirms payment received by {siteConfig.name}. Retain for your records.
      </p>
    </div>
  );
}

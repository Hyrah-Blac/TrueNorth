import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { DetailHeader } from "@/components/admin/layout/DetailHeader";
import { PaymentStatusBadge } from "@/components/payment/PaymentCard/PaymentStatusBadge";
import { RecheckPaymentButton } from "@/components/admin/dialogs/RecheckPaymentButton";
import { getPaymentForAdmin } from "@/features/admin/lib/getPaymentsForAdmin";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { NotFoundError, isAppError } from "@/lib/errors/AppError";

export const metadata: Metadata = { title: "Payment Details" };

interface AdminPaymentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminPaymentDetailPage({ params }: AdminPaymentDetailPageProps) {
  const { id } = await params;

  let payment;
  try {
    payment = await getPaymentForAdmin(id);
  } catch (error) {
    if (isAppError(error) && error instanceof NotFoundError) notFound();
    throw error;
  }

  const customer =
    typeof payment.customer === "object" && payment.customer !== null
      ? (payment.customer as unknown as { firstName?: string; lastName?: string; email?: string; phone?: string })
      : null;
  const bookingNumber = typeof payment.booking === "object" ? payment.booking.bookingNumber : undefined;
  const canRecheck =
    (payment.status === PAYMENT_STATUSES.PENDING || payment.status === PAYMENT_STATUSES.PROCESSING) &&
    Boolean(payment.mpesa.checkoutRequestId);

  const rows: { label: string; value: string }[] = [
    ...(bookingNumber ? [{ label: "Booking", value: bookingNumber }] : []),
    { label: "Method", value: payment.method === "mpesa" ? "M-Pesa" : payment.method },
    { label: "Phone", value: payment.mpesa.phoneNumber ?? "—" },
    { label: "M-Pesa receipt", value: payment.mpesa.mpesaReceiptNumber ?? "—" },
    { label: "Checkout request ID", value: payment.mpesa.checkoutRequestId ?? "—" },
    { label: "Submitted", value: formatDateTime(payment.createdAt) },
    ...(payment.mpesa.transactionDate
      ? [{ label: "Completed", value: formatDateTime(payment.mpesa.transactionDate) }]
      : []),
    ...(payment.failureReason ? [{ label: "Failure reason", value: payment.failureReason }] : []),
  ];

  return (
    <div>
      <DetailHeader
        backHref="/admin/payments"
        backLabel="Payments"
        eyebrow="Payment"
        title={payment.paymentNumber}
        status={<PaymentStatusBadge status={payment.status} />}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-navy-950 to-navy-900 p-7 shadow-soft">
            <p className="text-xs uppercase tracking-widest2 text-slate-400">Amount</p>
            <p className="mt-2 font-editorial text-4xl font-light text-white">
              {formatCurrency(payment.amount, payment.currency)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
            <dl className="divide-y divide-slate-100">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-3 text-sm">
                  <dt className="text-slate-500">{row.label}</dt>
                  <dd className="spec-readout font-medium text-navy-900">{row.value}</dd>
                </div>
              ))}
            </dl>

            {canRecheck ? (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <RecheckPaymentButton paymentId={payment._id} />
              </div>
            ) : null}
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
          <h3 className="font-display text-base font-semibold text-navy-900">Customer</h3>
          {customer ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="font-medium text-navy-900">
                {customer.firstName} {customer.lastName}
              </p>
              {customer.email ? (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                  <a href={`mailto:${customer.email}`} className="hover:text-sky-600">
                    {customer.email}
                  </a>
                </div>
              ) : null}
              {customer.phone ? (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                  {customer.phone}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              This customer&apos;s account has been deleted.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
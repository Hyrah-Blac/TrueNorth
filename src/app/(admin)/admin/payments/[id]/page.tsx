import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, ArrowUpRight } from "lucide-react";
import { DetailHeader } from "@/components/admin/layout/DetailHeader";
import { PaymentStatusBadge } from "@/components/payment/PaymentCard/PaymentStatusBadge";
import { Receipt } from "@/components/payment/Receipt/Receipt";
import { RecheckPaymentButton } from "@/components/admin/dialogs/RecheckPaymentButton";
import { RouteDisplay } from "@/components/shared/RouteDisplay";
import { getPaymentForAdmin } from "@/features/admin/lib/getPaymentsForAdmin";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { formatCurrency } from "@/utils/currency";
import { formatDate, formatDateTime } from "@/utils/date";
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

  const settings = await getSiteSettings();

  const customer = typeof payment.customer === "object" && payment.customer !== null ? payment.customer : null;
  const booking = typeof payment.booking === "object" && payment.booking !== null ? payment.booking : null;
  const aircraft = booking && typeof booking.aircraft === "object" ? booking.aircraft : undefined;
  const isPaystack = payment.provider === "paystack";
  const canRecheck =
    (payment.status === PAYMENT_STATUSES.PENDING || payment.status === PAYMENT_STATUSES.PROCESSING) &&
    ((!isPaystack && Boolean(payment.mpesa.checkoutRequestId)) || (isPaystack && Boolean(payment.paystack.reference)));

  // Resolve airport names only when a booking is linked
  const airportNames =
    booking
      ? await getAirportNamesByCodes([booking.departureAirportCode, booking.destinationAirportCode])
      : {};

  const rows: { label: string; value: string }[] = isPaystack
    ? [
        { label: "Provider", value: "Paystack" },
        { label: "Method", value: payment.method === "card" ? "Card" : "M-Pesa (via Paystack)" },
        { label: "Channel", value: payment.paystack.channel ?? "—" },
        { label: "Paystack reference", value: payment.paystack.reference ?? "—" },
        { label: "Paystack transaction ID", value: payment.paystack.transactionId?.toString() ?? "—" },
        ...(payment.paystack.authorization?.last4
          ? [
              {
                label: "Card",
                value: `${payment.paystack.authorization.cardType ?? ""} ····${payment.paystack.authorization.last4}`.trim(),
              },
            ]
          : []),
        { label: "Submitted", value: formatDateTime(payment.createdAt) },
        ...(payment.paystack.paidAt
          ? [{ label: "Completed", value: formatDateTime(payment.paystack.paidAt) }]
          : []),
        ...(payment.paystack.gatewayResponse
          ? [{ label: "Gateway response", value: payment.paystack.gatewayResponse }]
          : []),
        ...(payment.failureReason ? [{ label: "Failure reason", value: payment.failureReason }] : []),
      ]
    : [
        { label: "Provider", value: "Direct M-Pesa (Daraja)" },
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
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-navy-950 to-navy-900 p-7">
            <p className="text-xs uppercase tracking-widest2 text-slate-400">Amount</p>
            <p className="mt-2 font-editorial text-4xl font-light text-white">
              {formatCurrency(payment.amount, payment.currency)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-7">
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

          {booking ? (
            <div className="rounded-xl border border-slate-200 bg-white p-7">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-navy-900">Booking</h3>
                <Link
                  href={`/admin/bookings/${booking._id}`}
                  className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-sky-600 transition-colors hover:text-sky-700"
                >
                  View booking <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-4">
                {/* Premium route display replacing the plain "DEP → DEST" row */}
                <RouteDisplay
                  departure={{
                    code: booking.departureAirportCode,
                    name: airportNames[booking.departureAirportCode],
                  }}
                  destination={{
                    code: booking.destinationAirportCode,
                    name: airportNames[booking.destinationAirportCode],
                  }}
                  size="md"
                />
              </div>

              <dl className="mt-5 divide-y divide-slate-100 text-sm">
                <div className="flex items-center justify-between py-3">
                  <dt className="text-slate-500">Reference</dt>
                  <dd className="spec-readout font-medium text-navy-900">{booking.bookingNumber}</dd>
                </div>
                <div className="flex items-center justify-between py-3">
                  <dt className="text-slate-500">Departure</dt>
                  <dd className="spec-readout font-medium text-navy-900">{formatDate(booking.departureDate)}</dd>
                </div>
                {aircraft ? (
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-slate-500">Aircraft</dt>
                    <dd className="spec-readout font-medium text-navy-900">
                      {aircraft.name}
                      {aircraft.registration ? ` · ${aircraft.registration}` : ""}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          {payment.status === PAYMENT_STATUSES.COMPLETED ? (
            <Receipt payment={payment} companyName={settings.companyName} contactEmail={settings.email} />
          ) : null}
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-7">
          <h3 className="font-display text-base font-semibold text-navy-900">Customer</h3>
          {customer ? (
            <div className="mt-4 space-y-3 text-sm">
              <Link href={`/admin/customers/${customer._id}`} className="font-medium text-navy-900 hover:text-sky-600">
                {customer.firstName} {customer.lastName}
              </Link>
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

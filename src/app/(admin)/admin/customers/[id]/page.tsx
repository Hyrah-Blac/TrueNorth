import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, Phone, Building2 } from "lucide-react";
import { BookingStatusBadge } from "@/components/booking/BookingCard/BookingStatusBadge";
import { QuoteStatusBadge } from "@/components/quote/QuoteStatusBadge";
import { CustomerActionsPanel } from "@/components/admin/dialogs/CustomerActionsPanel";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { getCustomerForAdmin } from "@/features/admin/lib/getCustomersForAdmin";
import { formatDate } from "@/utils/date";
import { NotFoundError, isAppError } from "@/lib/errors/AppError";

export const metadata: Metadata = { title: "Customer Details" };

interface AdminCustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCustomerDetailPage({ params }: AdminCustomerDetailPageProps) {
  const { id } = await params;

  let detail;
  try {
    detail = await getCustomerForAdmin(id);
  } catch (error) {
    if (isAppError(error) && error instanceof NotFoundError) notFound();
    throw error;
  }

  const { user, bookings, quotes } = detail;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr,1.4fr]">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
          <h2 className="font-editorial text-2xl font-light italic text-navy-900">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-xs text-slate-500">Joined {formatDate(user.createdAt)}</p>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
              <a href={`mailto:${user.email}`} className="hover:text-sky-600">
                {user.email}
              </a>
            </div>
            {user.phone ? (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {user.phone}
              </div>
            ) : null}
            {user.company ? (
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {user.company}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
          <h3 className="font-display text-base font-semibold text-navy-900">Account</h3>
          <div className="mt-4">
            <CustomerActionsPanel userId={user._id} role={user.role} isActive={user.isActive} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
          <h3 className="font-display text-base font-semibold text-navy-900">Recent bookings</h3>
          <div className="mt-4 space-y-3">
            {bookings.length === 0 ? (
              <EmptyState title="No bookings yet" description="This customer has no bookings on record." />
            ) : (
              bookings.map((booking) => (
                <div key={booking._id} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0">
                  <div>
                    <p className="spec-readout font-medium text-navy-900">{booking.bookingNumber}</p>
                    <p className="text-xs text-slate-500">
                      {booking.departureAirportCode} → {booking.destinationAirportCode}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
          <h3 className="font-display text-base font-semibold text-navy-900">Recent quotes</h3>
          <div className="mt-4 space-y-3">
            {quotes.length === 0 ? (
              <EmptyState title="No quotes yet" description="This customer has no charter requests on record." />
            ) : (
              quotes.map((quote) => (
                <div key={quote._id} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0">
                  <div>
                    <p className="spec-readout font-medium text-navy-900">{quote.quoteNumber}</p>
                    <p className="text-xs text-slate-500">
                      {quote.departureAirportCode} → {quote.destinationAirportCode}
                    </p>
                  </div>
                  <QuoteStatusBadge status={quote.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

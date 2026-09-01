import type { Metadata } from "next";
import { Receipt } from "@phosphor-icons/react/dist/ssr";
import { PaymentRow } from "@/components/payment/PaymentRow";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getMyPayments } from "@/features/payment/lib/getPayments";

export const metadata: Metadata = { title: "Payment History" };

export default async function PaymentsPage() {
  const payments = await getMyPayments();

  return (
    <div className="mx-auto flex min-h-[75vh] w-full max-w-5xl flex-col justify-center py-8 sm:py-12 lg:py-16">
      <div>
        <PageHeader
          variant="light"
          divider={false}
          title="Payment History"
          description="Every payment made toward your bookings, with receipts where available."
        />

        {payments.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Receipt className="h-5 w-5" aria-hidden="true" />}
              title="No payments yet"
              description="Payments you make toward a booking will appear here, along with receipts."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <PaymentRow key={payment._id} payment={payment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
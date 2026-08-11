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
    <div>
      <PageHeader
        variant="light"
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
        <div className="divide-y divide-slate-100 border-t border-slate-100">
          {payments.map((payment) => (
            <PaymentRow key={payment._id} payment={payment} />
          ))}
        </div>
      )}
    </div>
  );
}
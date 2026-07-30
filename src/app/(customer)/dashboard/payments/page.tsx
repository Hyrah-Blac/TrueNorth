import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { PaymentCard } from "@/components/payment/PaymentCard/PaymentCard";
import { PaymentsTable } from "@/components/payment/PaymentCard/PaymentsTable";
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
        <EmptyState
          icon={<Receipt className="h-5 w-5" aria-hidden="true" />}
          title="No payments yet"
          description="Payments you make toward a booking will appear here, along with receipts."
        />
      ) : (
        <>
          <PaymentsTable payments={payments} />
          <div className="space-y-4 md:hidden">
            {payments.map((payment) => (
              <PaymentCard key={payment._id} payment={payment} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

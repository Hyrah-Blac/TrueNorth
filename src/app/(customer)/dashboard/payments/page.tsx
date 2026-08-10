import type { Metadata } from "next";
import { Receipt, Wallet, Hourglass } from "lucide-react";
import { PaymentCard } from "@/components/payment/PaymentCard/PaymentCard";
import { PaymentsTable } from "@/components/payment/PaymentCard/PaymentsTable";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/cards/StatCard";
import { getMyPayments } from "@/features/payment/lib/getPayments";
import { formatCurrency } from "@/utils/currency";

export const metadata: Metadata = { title: "Payment History" };

export default async function PaymentsPage() {
  const payments = await getMyPayments();

  const completed = payments.filter((payment) => payment.status === "completed");
  const totalPaid = completed.reduce((sum, payment) => sum + payment.amount, 0);
  const needsAttention = payments.filter((payment) =>
    ["pending", "processing", "failed"].includes(payment.status)
  ).length;

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
          <div className="grid grid-cols-1 gap-5 pb-7 sm:grid-cols-3">
            <StatCard
              label="Total paid"
              value={formatCurrency(totalPaid, completed[0]?.currency)}
              icon={Wallet}
              hint={`${completed.length} completed payment${completed.length === 1 ? "" : "s"}`}
            />
            <StatCard label="Payments on file" value={String(payments.length)} icon={Receipt} />
            <StatCard
              label="Needs attention"
              value={String(needsAttention)}
              icon={Hourglass}
              hint={needsAttention === 0 ? "All caught up" : "Pending, processing or failed"}
            />
          </div>

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

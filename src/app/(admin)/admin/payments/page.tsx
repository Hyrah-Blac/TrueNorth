import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { AdminPaymentRow } from "@/components/admin/tables/AdminPaymentRow";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { FilterTabs } from "@/components/admin/layout/FilterTabs";
import { ListToolbar } from "@/components/admin/layout/ListToolbar";
import { getPaymentsForAdmin } from "@/features/admin/lib/getPaymentsForAdmin";
import { PAYMENT_STATUS_VALUES, PAYMENT_STATUS_LABELS, type PaymentStatus } from "@/database/constants/payment-status";

export const metadata: Metadata = { title: "Manage Payments" };

interface AdminPaymentsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
  const params = await searchParams;
  const status = PAYMENT_STATUS_VALUES.includes(params.status as PaymentStatus)
    ? (params.status as PaymentStatus)
    : undefined;

  const payments = await getPaymentsForAdmin(status);

  return (
    <div>
      <FilterTabs
        options={[
          { label: "All", href: "/admin/payments", active: !status },
          ...PAYMENT_STATUS_VALUES.map((value) => ({
            label: PAYMENT_STATUS_LABELS[value],
            href: `/admin/payments?status=${value}`,
            active: status === value,
          })),
        ]}
      />

      <div className="mt-6">
        <ListToolbar count={payments.length} noun="payment" />
      </div>

      <div className="mt-4 space-y-4">
        {payments.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-5 w-5" aria-hidden="true" />}
            title="No payments found"
            description="Payments will appear here once a customer pays a booking deposit or balance."
          />
        ) : (
          payments.map((payment) => <AdminPaymentRow key={payment._id} payment={payment} />)
        )}
      </div>
    </div>
  );
}

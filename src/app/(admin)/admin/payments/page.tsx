import type { Metadata } from "next";
import { Receipt, CheckCircle, Hourglass, XCircle, Wallet } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/cards/StatCard";
import { AdminPaymentRow } from "@/components/admin/tables/AdminPaymentRow";
import { PaymentSearchBox } from "@/components/admin/tables/PaymentSearchBox";
import { PaymentDateFilter } from "@/components/admin/tables/PaymentDateFilter";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { FilterTabs } from "@/components/admin/layout/FilterTabs";
import { ListToolbar } from "@/components/admin/layout/ListToolbar";
import { Pagination } from "@/components/shared/Pagination";
import { getPaymentsForAdmin, getPaymentSummary } from "@/features/admin/lib/getPaymentsForAdmin";
import { buildPaginationMeta } from "@/utils/pagination";
import { formatCurrency } from "@/utils/currency";
import { PAYMENT_STATUS_VALUES, PAYMENT_STATUS_LABELS, type PaymentStatus } from "@/database/constants/payment-status";

export const metadata: Metadata = { title: "Manage Payments" };

interface AdminPaymentsPageProps {
  searchParams: Promise<{ status?: string; search?: string; dateFrom?: string; dateTo?: string; page?: string }>;
}

function parseDateParam(value?: string, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
  const params = await searchParams;

  const status = PAYMENT_STATUS_VALUES.includes(params.status as PaymentStatus)
    ? (params.status as PaymentStatus)
    : undefined;
  const search = params.search?.trim() || undefined;
  const dateFrom = parseDateParam(params.dateFrom);
  const dateTo = parseDateParam(params.dateTo, true);
  const page = params.page ? Math.max(Number(params.page), 1) : 1;

  const filters = { status, search, dateFrom, dateTo, page };

  const [{ items: payments, total, limit }, summary] = await Promise.all([
    getPaymentsForAdmin(filters),
    getPaymentSummary(filters),
  ]);
  const meta = buildPaginationMeta(total, page, limit);

  function buildHref(overrides: { status?: string; page?: number }) {
    const next = new URLSearchParams();
    const nextStatus = "status" in overrides ? overrides.status : status;
    const nextPage = overrides.page;

    if (nextStatus) next.set("status", nextStatus);
    if (search) next.set("search", search);
    if (params.dateFrom) next.set("dateFrom", params.dateFrom);
    if (params.dateTo) next.set("dateTo", params.dateTo);
    if (nextPage && nextPage > 1) next.set("page", String(nextPage));

    const query = next.toString();
    return query ? `/admin/payments?${query}` : "/admin/payments";
  }

  const activeFilterCount = [status, search, dateFrom, dateTo].filter(Boolean).length;

  return (
    <div>
      <PageHeader title="Payments" description="Track deposits and balance payments across every booking." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Matching payments" value={String(summary.total)} icon={Receipt} />
        <StatCard label="Completed" value={String(summary.completed)} icon={CheckCircle} />
        <StatCard label="Pending / processing" value={String(summary.inProgress)} icon={Hourglass} />
        <StatCard label="Failed" value={String(summary.failed)} icon={XCircle} />
      </div>
      <div className="mt-5">
        <StatCard
          label="Total completed amount"
          value={formatCurrency(summary.totalCompletedAmount)}
          icon={Wallet}
        />
      </div>

      <div className="mt-6">
        <FilterTabs
          options={[
            { label: "All", href: buildHref({ status: undefined }), active: !status },
            ...PAYMENT_STATUS_VALUES.map((value) => ({
              label: PAYMENT_STATUS_LABELS[value],
              href: buildHref({ status: value }),
              active: status === value,
            })),
          ]}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <PaymentSearchBox />
        <PaymentDateFilter />
      </div>

      <div className="mt-4">
        <ListToolbar count={total} noun="payment" />
      </div>

      <div className="mt-4 space-y-4">
        {payments.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-5 w-5" aria-hidden="true" />}
            title={activeFilterCount > 0 ? "No payments match your current filters" : "No payments found"}
            description={
              activeFilterCount > 0
                ? "Try clearing a filter, widening the date range, or searching for something else."
                : "Payments will appear here once a customer pays a booking deposit or balance."
            }
          />
        ) : (
          payments.map((payment) => <AdminPaymentRow key={payment._id} payment={payment} />)
        )}
      </div>

      <Pagination page={meta.page} totalPages={meta.totalPages} buildHref={(p) => buildHref({ page: p })} />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CustomerSearchBox } from "@/components/admin/tables/CustomerSearchBox";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { ListToolbar } from "@/components/admin/layout/ListToolbar";
import { getCustomersForAdmin } from "@/features/admin/lib/getCustomersForAdmin";
import { formatDate } from "@/utils/date";

export const metadata: Metadata = { title: "Manage Customers" };

interface AdminCustomersPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const params = await searchParams;
  const customers = await getCustomersForAdmin(params.search);

  return (
    <div>
    <PageHeader
  title="Customers"
  description="Search and manage every account that has signed up on the site."
/>
      <ListToolbar count={customers.length} noun="customer">
        <CustomerSearchBox />
      </ListToolbar>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {customers.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Users className="h-5 w-5" aria-hidden="true" />}
              title={params.search ? "No matching customers" : "No customers found"}
              description={
                params.search
                  ? `Nothing matched "${params.search}". Try a different name or email.`
                  : "Customers will appear here once someone signs up on the site."
              }
            />
          </div>
        ) : (
          <div className="max-h-[32rem] overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-widest2 text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Name</th>
                  <th className="px-5 py-3.5 font-medium">Email</th>
                  <th className="px-5 py-3.5 font-medium">Joined</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer, index) => (
                  <tr
                    key={customer._id}
                    className={`transition-colors duration-200 hover:bg-sky-50/60 ${index % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`}
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/customers/${customer._id}`}
                        className="font-medium text-navy-900 transition-colors hover:text-sky-600"
                      >
                        {customer.firstName} {customer.lastName}
                      </Link>
                      {customer.company ? <p className="text-xs text-slate-500">{customer.company}</p> : null}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{customer.email}</td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(customer.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                          customer.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {customer.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
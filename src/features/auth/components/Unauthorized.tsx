import Link from "next/link";

export function Unauthorized() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-sky-600">
        Access restricted
      </p>
      <h2 className="text-2xl font-semibold text-slate-900">
        You don&apos;t have permission to view this page
      </h2>
      <p className="max-w-md text-slate-500">
        This area is reserved for authorized accounts. If you believe this is a mistake,
        please contact our support team.
      </p>
      <Link
        href="/dashboard/bookings"
        className="mt-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Return to your account
      </Link>
    </div>
  );
}
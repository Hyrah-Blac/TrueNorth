import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { Receipt } from "@/components/payment/Receipt/Receipt";
import { WrongAccountNotice } from "@/components/shared/WrongAccountNotice";
import { getMyPaymentById } from "@/features/payment/lib/getPayments";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { NotFoundError, ForbiddenError, isAppError } from "@/lib/errors/AppError";

export const metadata: Metadata = { title: "Receipt" };

interface PaymentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const { id } = await params;

  let payment;
  try {
    payment = await getMyPaymentById(id);
  } catch (error) {
    // See the matching comment in the quotes detail page: a Forbidden
    // here means "signed in with the wrong account," not "this
    // payment/receipt doesn't exist" — those deserve different screens.
    if (isAppError(error) && error instanceof ForbiddenError) {
      return <WrongAccountNotice resourceLabel="receipt" />;
    }
    if (isAppError(error) && error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/dashboard/payments"
        className="group mb-5 inline-flex items-center gap-2.5 print:hidden sm:mb-6"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all duration-200 group-hover:-translate-x-0.5 group-hover:border-sky-300 group-hover:bg-sky-50 group-hover:text-sky-600">
          <CaretLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span className="spec-readout text-xs uppercase tracking-widest2 text-slate-400 transition-colors group-hover:text-sky-600">
          All Payments
        </span>
      </Link>
      <Receipt payment={payment} contactEmail={settings.email} />
    </div>
  );
}
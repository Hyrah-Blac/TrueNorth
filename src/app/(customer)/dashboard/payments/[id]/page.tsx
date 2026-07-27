import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Receipt } from "@/components/payment/Receipt/Receipt";
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
    if (isAppError(error) && (error instanceof NotFoundError || error instanceof ForbiddenError)) {
      notFound();
    }
    throw error;
  }

  const settings = await getSiteSettings();

  return <Receipt payment={payment} contactEmail={settings.email} />;
}
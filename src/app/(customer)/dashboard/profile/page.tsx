import type { Metadata } from "next";
import { ProfileForm } from "@/components/dashboard/widgets/ProfileForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getCurrentUserProfile } from "@/features/auth/actions/user.actions";
import { NotFoundError } from "@/lib/errors/AppError";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const result = await getCurrentUserProfile();

  if (!result.success) {
    throw new NotFoundError(result.error);
  }

  const { data: user } = result;
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Keep your contact details current so we can reach you about bookings and quotes."
      />

      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
        <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-7">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-lg font-semibold text-sky-400 ring-1 ring-inset ring-gold-500/30">
            {initials || "?"}
          </span>
          <div>
            <p className="font-display text-base font-semibold text-navy-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <ProfileForm
          defaultValues={{
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone ?? "",
            company: user.company ?? "",
          }}
        />
      </div>
    </div>
  );
}

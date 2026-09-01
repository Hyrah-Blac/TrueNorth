import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProfileForm } from "@/components/dashboard/widgets/ProfileForm";
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
    <div className="max-w-2xl">
      <PageHeader
        variant="light"
        divider={false}
        title="Your Profile"
        description="Keep your contact details current so we can reach you about bookings and quotes."
      />

      <ProfileForm
        initials={initials}
        name={`${user.firstName} ${user.lastName}`.trim()}
        defaultValues={{
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone ?? "",
          company: user.company ?? "",
          avatarUrl: user.avatarUrl ?? "",
          avatarPublicId: user.avatarPublicId ?? "",
        }}
      />
    </div>
  );
}
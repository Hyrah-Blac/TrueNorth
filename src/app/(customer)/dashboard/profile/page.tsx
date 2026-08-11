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
  const memberSince = new Intl.DateTimeFormat("en-KE", { month: "long", year: "numeric" }).format(
    new Date(user.createdAt)
  );

  return (
    <div className="max-w-2xl">
      <PageHeader
        variant="light"
        title="Your Profile"
        description="Keep your contact details current so we can reach you about bookings and quotes."
      />

      <ProfileForm
        initials={initials}
        name={`${user.firstName} ${user.lastName}`.trim()}
        email={user.email}
        memberSince={memberSince}
        updatedAt={user.updatedAt}
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
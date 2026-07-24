"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/shared/buttons/Button";
import { updateUserRole, toggleUserActive } from "@/features/auth/actions/user.actions";
import { ROLES, type Role } from "@/database/constants/roles";

export function CustomerActionsPanel({
  userId,
  role,
  isActive,
}: {
  userId: string;
  role: Role;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRoleToggle() {
    setError(null);
    const nextRole = role === ROLES.ADMIN ? ROLES.CUSTOMER : ROLES.ADMIN;

    startTransition(async () => {
      const result = await updateUserRole({ userId, role: nextRole });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleActiveToggle() {
    setError(null);

    startTransition(async () => {
      const result = await toggleUserActive(userId, !isActive);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={handleRoleToggle}
          disabled={isPending}
          icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
        >
          {role === ROLES.ADMIN ? "Revoke Admin Access" : "Grant Admin Access"}
        </Button>
        <Button
          variant="ghost"
          onClick={handleActiveToggle}
          disabled={isPending}
          className={isActive ? "!text-red-600 hover:!bg-red-50" : ""}
        >
          {isActive ? "Deactivate Account" : "Reactivate Account"}
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

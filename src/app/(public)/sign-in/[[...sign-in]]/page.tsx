import type { Metadata } from "next";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to manage your True North Charters bookings, quotes, and account.",
};

// Metadata must come from a server component, so the interactive form
// lives in SignInForm.tsx ('use client') and is rendered here.
export default function SignInPage() {
  return <SignInForm />;
}
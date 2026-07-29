import type { Metadata } from "next";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a True North Charters account to request charters and track bookings.",
};

// Metadata must come from a server component, so the interactive form
// lives in SignUpForm.tsx ('use client') and is rendered here.
export default function SignUpPage() {
  return <SignUpForm />;
}
import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { Container } from "@/components/layout/container/Container";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a True North Charters account to request charters and track bookings.",
};

export default function SignUpPage() {
  return (
    <div className="border-t border-navy-800 bg-navy-950 py-20 lg:py-28">
      <Container className="flex flex-col items-center">
        <p className="spec-readout mb-6 text-xs font-medium uppercase tracking-widest2 text-sky-400">
          Client Portal
        </p>
        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#c8a95b",
              colorText: "#f8f8f6",
              colorTextSecondary: "#9a9fa8",
              colorBackground: "#111827",
              colorInputBackground: "#1a2433",
              colorInputText: "#f8f8f6",
              borderRadius: "0.25rem",
              fontFamily: "var(--font-body)",
            },
            elements: {
              card: "shadow-lifted border border-white/10",
              formButtonPrimary: "bg-sky-500 hover:bg-sky-600 text-xs font-medium uppercase tracking-[0.08em]",
              footerActionLink: "text-sky-400 hover:text-sky-300",
              headerTitle: "font-editorial italic",
            },
          }}
        />
      </Container>
    </div>
  );
}

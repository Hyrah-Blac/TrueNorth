"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { Container } from "@/components/layout/container/Container";
import { Button } from "@/components/shared/buttons/Button";
import { ROLES } from "@/database/constants/roles";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

const RESEND_WAIT = 30; // seconds

// ── parse Clerk's non-enumerable error object ────────────────────────────────
function parseClerkError(err: unknown): { code: string; message: string; longMessage: string } {
  const errorsArr = (err as { errors?: unknown })?.errors;
  const e = Array.isArray(errorsArr) ? errorsArr[0] : (err as any);
  return {
    code: String(e?.code ?? ""),
    message: String(e?.message ?? ""),
    longMessage: String(e?.longMessage ?? e?.message ?? ""),
  };
}

// Never reveal whether the email/account exists — same generic message
// for both a wrong password and an unrecognized identifier.
function friendlyError(code: string, message: string, longMessage: string): string {
  if (code === "form_password_incorrect" || code === "form_identifier_not_found")
    return "Incorrect email or password.";
  if (code === "too_many_requests") return "Too many attempts. Please wait and try again.";
  if (code.includes("captcha") || message.toLowerCase().includes("captcha"))
    return "Security check failed. Please refresh and try again.";
  if (code === "form_param_format_invalid" || message.toLowerCase().includes("email"))
    return "Please enter a valid email address.";
  if (
    code === "account_transfer_invalid" ||
    message.toLowerCase().includes("google") ||
    message.toLowerCase().includes("oauth")
  )
    return "This email is linked to a Google account. Please use Continue with Google below.";
  return longMessage || message || "Sign in failed. Please try again.";
}

// ── tiny inline icons (no extra dependency) ──────────────────────────────────
function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.5 5.3A10.4 10.4 0 0112 5c5 0 9 4 10.5 7-.6 1.2-1.5 2.5-2.7 3.6M6.2 6.6C4 8.1 2.4 10 1.5 12c1.5 3 5.5 7 10.5 7 1 0 2-.15 2.9-.42" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="mt-0.5 shrink-0">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function SignInForm() {
  const { signIn, setActive } = useSignIn();
  const clerk = useClerk();
  const router = useRouter();
  const { role, isSignedIn, isLoaded: userLoaded } = useCurrentUser();

  const redirectedRef = useRef(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stage, setStage] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // clean up countdown on unmount
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  // ── redirect once Clerk confirms the session ─────────────────────────────
  // Role comes straight from Clerk's publicMetadata (via useCurrentUser,
  // the same source of truth used everywhere else in the app) — there is
  // no backend "sync" call to wait on, since new users are already
  // upserted into Mongo by the Clerk webhook before they can sign in.
  useEffect(() => {
    if (!userLoaded || !isSignedIn) return;
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace(role === ROLES.ADMIN ? "/admin" : "/dashboard");
  }, [userLoaded, isSignedIn, role, router]);

  // ── cooldown ticker ───────────────────────────────────────────────────────
  const startCooldown = () => {
    setResendCooldown(RESEND_WAIT);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── sign in (form stage) ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setError("");
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        return;
      }

      const emailCodeFactor = result.supportedFirstFactors?.find(
        (f: any) => f.strategy === "email_code"
      ) as any;

      const needsEmail =
        result.status === "needs_second_factor" ||
        result.status === "needs_first_factor" ||
        Boolean(emailCodeFactor) ||
        result.supportedSecondFactors?.some((f: any) => f.strategy === "email_code");

      if (needsEmail) {
        try {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor?.emailAddressId ?? "",
          });
        } catch {
          // email_code isn't the first factor here (e.g. it's configured as
          // an MFA second factor after password) — prepare that instead so
          // a code actually gets sent before the verify screen shows.
          try {
            await (signIn as any).prepareSecondFactor({ strategy: "email_code" });
          } catch {
            // Neither applies — nothing we can do but let the verify
            // screen's own error handling surface the real problem.
          }
        }
        setStage("verify");
        startCooldown();
      } else {
        setError("Additional verification required. Please check your email.");
      }
    } catch (err) {
      const { code, message, longMessage } = parseClerkError(err);
      setError(friendlyError(code, message, longMessage));
    } finally {
      setLoading(false);
    }
  };

  // ── verify (OTP stage) ─────────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setError("");
    setLoading(true);
    try {
      let result: any;
      try {
        result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
      } catch {
        result = await (signIn as any).attemptSecondFactor({ strategy: "email_code", code });
      }

      const status = result?.status ?? signIn.status;
      const sessionId = result?.createdSessionId ?? signIn.createdSessionId;

      if (status === "complete") {
        await setActive({ session: sessionId });
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err) {
      const { code, message, longMessage } = parseClerkError(err);
      setError(friendlyError(code, message, longMessage));
    } finally {
      setLoading(false);
    }
  };

  // ── resend code ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!signIn || resendLoading || resendCooldown > 0) return;
    setResendLoading(true);
    setResendSuccess(false);
    setError("");
    try {
      const emailCodeFactor = (signIn as any).supportedFirstFactors?.find(
        (f: any) => f.strategy === "email_code"
      ) as any;
      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailCodeFactor?.emailAddressId ?? "",
      });
      setResendSuccess(true);
      startCooldown();
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err) {
      const { code, message, longMessage } = parseClerkError(err);
      setError(friendlyError(code, message, longMessage));
    } finally {
      setResendLoading(false);
    }
  };

  // ── google ────────────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    // Guard clerk.client explicitly rather than using a non-null assertion —
    // it can briefly be undefined while Clerk finishes loading.
    if (!clerk.loaded || googleLoading) return;
    setGoogleLoading(true);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || window.location.origin;

    const clerkSignIn = clerk.client?.signIn;
    if (!clerkSignIn) {
      setError("Auth not ready. Please refresh the page and try again.");
      setGoogleLoading(false);
      return;
    }

    try {
      await clerkSignIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${appUrl}/sso-callback`,
        // Land back on /sign-in (not the homepage) so this component's own
        // isSignedIn effect is still mounted to run the role-based redirect
        // (admin -> /admin, everyone else -> /dashboard).
        redirectUrlComplete: `${appUrl}/sign-in`,
      });
    } catch (err) {
      const { message, longMessage } = parseClerkError(err);
      setError(longMessage || message || "Google sign in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  if (!clerk.loaded) return null;

  // Brief holding screen while the redirect effect above fires — there's
  // no backend round-trip to wait on, so this should only flash briefly.
  if (isSignedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 bg-navy-950">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-sky-400" />
        <p className="text-sm font-light text-white/50">Signing you in…</p>
      </div>
    );
  }

  const labelClass = "mb-2 block text-[0.7rem] font-medium uppercase tracking-[0.15em] text-white/50";
  const inputClass =
    "w-full rounded-lg border border-white/10 bg-navy-800/60 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors duration-300 focus:border-sky-400 focus:bg-navy-800";
  const errorBoxClass =
    "mb-4 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-relaxed text-red-300";

  return (
    <div className="border-t border-navy-800 bg-navy-950 py-20 lg:py-28">
      <Container className="flex flex-col items-center">
        <p className="spec-readout mb-4 text-xs font-medium uppercase tracking-widest2 text-sky-400">
          Client Portal
        </p>

        <h1 className="font-editorial text-3xl font-light uppercase leading-tight tracking-[0.01em] text-white sm:text-4xl">
          {stage === "form" ? "Welcome back" : "Check your email"}
        </h1>

        <div className="mt-6 h-px w-12 bg-white/20" />

        <p className="mt-6 max-w-sm text-center text-sm font-light leading-relaxed text-slate-300">
          {stage === "form"
            ? "Sign in to manage your bookings, quotes, and account."
            : `We sent a verification code to ${email}`}
        </p>

        <div className="mt-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-lifted sm:p-10">
          {stage === "form" && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-5">
                <label htmlFor="email" className={labelClass}>Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div className="mb-6">
                <div className="mb-2 flex items-baseline justify-between">
                  <label htmlFor="password" className="text-[0.7rem] font-medium uppercase tracking-[0.15em] text-white/50">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center text-white/40 hover:text-white/70"
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </div>
              </div>

              {error && (
                <div className={errorBoxClass} role="alert">
                  <AlertIcon />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || googleLoading}
                className="w-full justify-center"
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>

              <div className="my-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[0.65rem] font-medium uppercase tracking-widest2 text-white/30">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                disabled={googleLoading || loading}
                onClick={handleGoogleSignIn}
                icon={googleLoading ? undefined : <GoogleIcon />}
                className="w-full justify-center gap-3"
              >
                {googleLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  "Continue with Google"
                )}
              </Button>

              {/* Clerk's bot-protection widget mounts here automatically when
                  Smart CAPTCHA is enabled for the instance — safe to leave
                  even if it's off, Clerk simply renders nothing. */}
              <div id="clerk-captcha" />
            </form>
          )}

          {stage === "verify" && (
            <form onSubmit={handleVerify} noValidate>
              <div className="mb-6">
                <label htmlFor="code" className={labelClass}>Verification code</label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className={`${inputClass} text-center text-xl font-medium tracking-[0.4em]`}
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-light text-white/40">
                    Didn&apos;t receive it? Check your spam folder.
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || resendCooldown > 0}
                    className={`whitespace-nowrap text-xs font-medium ${
                      resendCooldown > 0 ? "text-white/30" : "text-sky-400 hover:text-sky-300"
                    }`}
                  >
                    {resendLoading ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>

                {resendSuccess && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <CheckIcon />
                    New code sent — check your inbox.
                  </p>
                )}
              </div>

              {error && (
                <div className={errorBoxClass} role="alert">
                  <AlertIcon />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || code.length < 6}
                className="w-full justify-center"
              >
                {loading ? "Verifying…" : "Verify email"}
              </Button>

              <button
                type="button"
                className="mt-3 w-full text-center text-xs font-medium uppercase tracking-[0.12em] text-white/40 hover:text-white/70"
                onClick={() => { setStage("form"); setError(""); setCode(""); setResendCooldown(0); setResendSuccess(false); }}
              >
                Back
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm font-light text-slate-300">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-sky-400 hover:text-sky-300">
            Create one
          </Link>
        </p>
      </Container>
    </div>
  );
}
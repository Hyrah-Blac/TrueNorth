"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";
import type {
  EmailCodeFactor,
  SignInFirstFactor,
  SignInResource,
  SignInSecondFactor,
} from "@clerk/types";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/container/Container";
import { Button } from "@/components/shared/buttons/Button";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

const RESEND_WAIT = 30; // seconds
const OTP_LENGTH = 6;
const VERIFIED_SUCCESS_DELAY = 400; // ms — brief "✓ Verified" beat before redirecting

// Background photo behind the sign-in card. Swap this path if the asset
// moves; it's read from /public so no import needed.
const BACKGROUND_IMAGE = "/images/aircraft/sign.jpg";

// Logo shown in place of the site navbar on this page.
const LOGO_IMAGE = "/logo/logo.png";

// ── parse Clerk's non-enumerable error object ────────────────────────────────
interface ClerkErrorDetail {
  code?: string;
  message?: string;
  longMessage?: string;
}

function parseClerkError(err: unknown): { code: string; message: string; longMessage: string } {
  const errorsArr = (err as { errors?: unknown })?.errors;
  const e = (Array.isArray(errorsArr) ? errorsArr[0] : err) as ClerkErrorDetail | undefined;
  return {
    code: String(e?.code ?? ""),
    message: String(e?.message ?? ""),
    longMessage: String(e?.longMessage ?? e?.message ?? ""),
  };
}

// Narrows a first/second factor down to the email_code variant so we can
// read `emailAddressId` off it without casting.
function isEmailCodeFactor(
  factor: SignInFirstFactor | SignInSecondFactor
): factor is EmailCodeFactor {
  return factor.strategy === "email_code";
}

// Generic, enumeration-safe error copy. This app must never let a response
// reveal whether an email is registered or which provider it uses — those
// cases are absorbed silently in handleSubmit/handleVerify instead of
// reaching this function. What's left here are genuine input/rate-limit
// problems that are safe to surface as-is.
function friendlyError(code: string, message: string): string {
  if (code === "too_many_requests") return "Too many attempts. Please wait and try again.";
  if (code.includes("captcha") || message.toLowerCase().includes("captcha"))
    return "Security check failed. Please refresh and try again.";
  if (code === "form_param_format_invalid" || message.toLowerCase().includes("email"))
    return "Please enter a valid email address.";
  return "Something went wrong. Please try again.";
}

// Masks an email for display (e.g. "jo••••••@gmail.com") without touching
// the underlying value used for actual Clerk calls — purely cosmetic, for
// privacy in screenshots and shared screens.
function maskEmail(value: string): string {
  const atIndex = value.indexOf("@");
  if (atIndex <= 0) return value;
  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex);
  const visibleCount = Math.min(2, local.length);
  const visible = local.slice(0, visibleCount);
  const maskedLength = Math.max(local.length - visibleCount, 4);
  return `${visible}${"•".repeat(maskedLength)}${domain}`;
}

// ── tiny inline icons (no extra dependency) ──────────────────────────────────
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
  const { isSignedIn, isLoaded: userLoaded } = useCurrentUser();

  const redirectedRef = useRef(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Ref-based locks (rather than relying on the `loading` state alone) so a
  // second click that lands before React re-renders the disabled button
  // still can't fire a duplicate submission.
  const submitLockRef = useRef(false);
  const verifyLockRef = useRef(false);
  const resendLockRef = useRef(false);
  const googleLockRef = useRef(false);

  const [stage, setStage] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // clean up countdown on unmount
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  // ── redirect once Clerk confirms the session ─────────────────────────────
  useEffect(() => {
    if (!userLoaded || !isSignedIn) return;
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace("/");
  }, [userLoaded, isSignedIn, router]);

  // ── autofocus the OTP input the moment the verify screen mounts ─────────
  useEffect(() => {
    if (stage === "verify") {
      otpRefs.current[0]?.focus();
    }
  }, [stage]);

  // ── stop the resend timer the moment we're not on the verify screen ─────
  // Belt-and-braces alongside handleBack's own cleanup: whatever path gets
  // us out of "verify", the interval never keeps ticking in the background.
  useEffect(() => {
    if (stage !== "verify" && cooldownRef.current) {
      clearInterval(cooldownRef.current);
      cooldownRef.current = null;
    }
  }, [stage]);

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

  // ── send code (form stage) ────────────────────────────────────────────────
  // Clerk's passwordless Email Code flow: `signIn.create` with just an
  // identifier starts the attempt, then we prepare the email_code first
  // factor to actually send the code.
  //
  // Enumeration safety: regardless of whether the email is registered, has
  // no email_code factor configured (e.g. it's Google-only), or genuinely
  // doesn't exist, the UI always ends up in the exact same place — the
  // verify screen with the same generic copy. Nothing here ever branches on
  // *why* a code wasn't sent, since that branch is itself the leak.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || submitLockRef.current) return;
    submitLockRef.current = true;
    setError("");
    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const result = await signIn.create({ identifier: trimmedEmail });
      const emailCodeFactor = result.supportedFirstFactors?.find(isEmailCodeFactor);

      if (emailCodeFactor) {
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailCodeFactor.emailAddressId,
        });
      }

      setStage("verify");
      startCooldown();
    } catch (err) {
      const { code, message } = parseClerkError(err);

      if (code === "form_identifier_not_found") {
        // Same generic outcome as a real account — see note above.
        setStage("verify");
        startCooldown();
      } else {
        setError(friendlyError(code, message));
      }
    } finally {
      submitLockRef.current = false;
      setLoading(false);
    }
  };

  // ── verify (OTP stage) ─────────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || verifyLockRef.current) return;
    verifyLockRef.current = true;
    setError("");
    setLoading(true);
    try {
      let result: SignInResource;
      try {
        result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
      } catch {
        result = await signIn.attemptSecondFactor({ strategy: "email_code", code });
      }

      const status = result?.status ?? signIn.status;
      const sessionId = result?.createdSessionId ?? signIn.createdSessionId;

      if (status === "complete") {
        // Brief, deliberate success beat before the session goes active and
        // the redirect effect fires — long enough to register, short enough
        // to stay snappy.
        setVerifiedSuccess(true);
        await new Promise((resolve) => setTimeout(resolve, VERIFIED_SUCCESS_DELAY));
        await setActive({ session: sessionId });
      } else {
        setError("That code didn't work. Please try again.");
      }
    } catch {
      // Covers wrong code, expired code, and the case where no sign-in
      // attempt exists at all (unregistered email) — one honest but
      // non-revealing message for all of them.
      setError("That code didn't work. Please try again.");
    } finally {
      verifyLockRef.current = false;
      setLoading(false);
    }
  };

  // ── resend code ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!signIn || resendLockRef.current || resendCooldown > 0) return;
    resendLockRef.current = true;
    setResendLoading(true);
    setResendSuccess(false);
    setError("");
    try {
      const emailCodeFactor = signIn.supportedFirstFactors?.find(isEmailCodeFactor);
      if (emailCodeFactor) {
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailCodeFactor.emailAddressId,
        });
      }
      // Same generic success state whether or not a code could actually be
      // sent — see the enumeration-safety note on handleSubmit.
      setResendSuccess(true);
      startCooldown();
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err) {
      const { code, message } = parseClerkError(err);
      setError(friendlyError(code, message));
    } finally {
      resendLockRef.current = false;
      setResendLoading(false);
    }
  };

  // ── google ────────────────────────────────────────────────────────────────
  // Google stays as a secondary, independent path. Account linking so the
  // same person can't end up with two accounts (one via email code, one via
  // Google) is a Clerk instance setting, not something this component
  // controls — enable "Account linking by verified email" for Google in the
  // Clerk Dashboard under User & Authentication > Social Connections /
  // Attack Protection so a matching verified email always resolves to one
  // account regardless of which method the person used first.
  const handleGoogleSignIn = async () => {
    // Guard clerk.client explicitly rather than using a non-null assertion —
    // it can briefly be undefined while Clerk finishes loading.
    if (!clerk.loaded || googleLockRef.current) return;
    googleLockRef.current = true;
    setGoogleLoading(true);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || window.location.origin;

    const clerkSignIn = clerk.client?.signIn;
    if (!clerkSignIn) {
      setError("Something went wrong. Please refresh the page and try again.");
      googleLockRef.current = false;
      setGoogleLoading(false);
      return;
    }

    try {
      await clerkSignIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${appUrl}/sso-callback`,
        // Land back on /sign-in (not the homepage directly) so this
        // component's own isSignedIn effect is still mounted to run the
        // redirect to home.
        redirectUrlComplete: `${appUrl}/sign-in`,
      });
    } catch {
      // Always release the button — a thrown redirect must never leave the
      // UI stuck in a spinning state.
      setError("Something went wrong. Please try again.");
      googleLockRef.current = false;
      setGoogleLoading(false);
    }
  };

  // ── back to the form stage ────────────────────────────────────────────────
  // Fully resets verify-stage state (including stopping the resend interval)
  // so re-entering the flow never inherits stale timers or messages.
  const handleBack = () => {
    if (cooldownRef.current) {
      clearInterval(cooldownRef.current);
      cooldownRef.current = null;
    }
    setStage("form");
    setError("");
    setCode("");
    setLoading(false);
    setResendCooldown(0);
    setResendSuccess(false);
    setVerifiedSuccess(false);
  };

  // ── OTP box helpers ───────────────────────────────────────────────────────
  const handleOtpChange = (index: number, rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, "");

    if (digitsOnly.length > 1) {
      // Mobile autofill (or fast typing) can drop the whole code into a
      // single box — treat it the same as a paste.
      const combined = (code.slice(0, index) + digitsOnly).slice(0, OTP_LENGTH);
      setCode(combined);
      otpRefs.current[Math.min(combined.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    const next = code.split("");
    next[index] = digitsOnly;
    setCode(next.join("").slice(0, OTP_LENGTH));

    if (digitsOnly && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setCode(pasted);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  if (!clerk.loaded) return null;

  // Brief holding screen while the redirect effect above fires — there's
  // no backend round-trip to wait on, so this should only flash briefly.
  if (isSignedIn) {
    return (
      <div className="relative flex min-h-[60vh] flex-col items-center justify-center gap-5 overflow-hidden bg-navy-950">
        <Image src={BACKGROUND_IMAGE} alt="" fill priority className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-navy-950/70" />
        <div className="relative h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-sky-400" />
        <p className="relative text-sm font-light text-white/50">Signing you in…</p>
      </div>
    );
  }

  const labelClass = "mb-2 block text-[0.7rem] font-medium uppercase tracking-[0.15em] text-white";
  const inputClass =
    "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none backdrop-blur-sm transition-colors duration-300 focus:border-sky-400 focus:bg-white/10 focus:ring-2 focus:ring-sky-400/30";
  const otpBoxClass =
    "h-12 w-10 rounded-lg border border-white/15 bg-white/5 text-center text-lg font-medium text-white outline-none backdrop-blur-sm transition-colors duration-300 focus:border-sky-400 focus:bg-white/10 focus:ring-2 focus:ring-sky-400/30 disabled:opacity-60 sm:h-14 sm:w-12 sm:text-xl";
  const errorBoxClass =
    "mb-4 flex items-start gap-2 rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm leading-relaxed text-red-200 backdrop-blur-sm";

  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:py-20">
      {/* Full-bleed background photo, fixed behind everything on the page.
          Slight blur (with a small scale-up to hide the blurred edges)
          softens the photo so the foreground text and card pop more. */}
      <Image
        src={BACKGROUND_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 scale-110 object-cover blur-[3px]"
      />

      <Container className="flex w-full flex-col items-center">
        {/* Logo only — no site navbar on this page. */}
        <Link href="/" className="mb-8 inline-flex items-center sm:mb-10" aria-label="Go to homepage">
          <Image
            src={LOGO_IMAGE}
            alt="True North Charters"
            width={160}
            height={40}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        <h1 className="text-center font-display text-3xl font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] sm:text-4xl lg:text-5xl">
          {stage === "form" ? "Welcome back" : "Verify your email"}
        </h1>

        <div className="mt-5 h-px w-12 bg-white/50 sm:mt-6" />

        <p className="mt-5 max-w-sm text-center text-sm leading-relaxed text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)] sm:mt-6 sm:text-base">
          {stage === "form" ? (
            "Sign in to manage your bookings, quotes, and account."
          ) : (
            <>
              We sent a 6-digit verification code to
              <br />
              <span className="font-medium text-white">{maskEmail(email.trim())}</span>
            </>
          )}
        </p>

        {/* Glass card — transparent, blurred, and bordered so it sits on
            top of the photo rather than hiding it. */}
        <div className="mt-8 w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.07] p-6 shadow-lifted backdrop-blur-xl sm:mt-10 sm:p-8 lg:p-10">
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
                  onChange={(e) => setEmail(e.target.value.replace(/^\s+/, ""))}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              {error && (
                <div className={errorBoxClass} role="alert">
                  <AlertIcon />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="blue"
                size="lg"
                disabled={loading || googleLoading}
                className="w-full justify-center text-white"
              >
                {loading ? "Sending code…" : "Continue"}
              </Button>

              <div className="my-6 flex items-center gap-3 sm:my-7">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[0.65rem] font-medium uppercase tracking-widest2 text-white/60">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                disabled={googleLoading || loading}
                onClick={handleGoogleSignIn}
                icon={googleLoading ? undefined : <GoogleIcon />}
                className="w-full justify-center gap-3 text-white"
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
              {/* Screen-reader-only announcement for the success transition —
                  the visible cue lives in the submit button below. */}
              <div aria-live="polite" className="sr-only">
                {verifiedSuccess ? "Verification successful. Signing you in." : ""}
              </div>

              <div className="mb-6">
                <span className={labelClass}>Verification code</span>
                <div
                  className="flex justify-center gap-2 sm:gap-3"
                  role="group"
                  aria-label="6-digit verification code"
                >
                  {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={1}
                      required
                      disabled={loading}
                      value={code[i] ?? ""}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                      className={otpBoxClass}
                    />
                  ))}
                </div>

                <div className="mt-3 flex flex-col gap-2 xs:flex-row xs:items-center xs:justify-between">
                  <p className="text-xs font-light text-white/40">
                    Didn&apos;t receive it? Check your spam folder.
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || resendCooldown > 0}
                    className={`whitespace-nowrap text-left text-xs font-medium xs:text-right ${
                      resendCooldown > 0 ? "text-white/30" : "text-sky-400 hover:text-sky-300"
                    }`}
                  >
                    {resendLoading ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>

                {resendCooldown > 0 && !resendSuccess && (
                  <p className="mt-2 text-xs font-light text-white/30">
                    You can request a new code once the timer finishes.
                  </p>
                )}

                {resendSuccess && (
                 <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-400">
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
                variant="blue"
                size="lg"
                disabled={loading || code.length < OTP_LENGTH}
                className="w-full justify-center"
              >
                {verifiedSuccess ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckIcon />
                    Verified
                  </span>
                ) : loading ? (
                  "Verifying…"
                ) : (
                  "Sign In"
                )}
              </Button>

              <button
                type="button"
                className="mt-3 w-full text-center text-xs font-medium uppercase tracking-[0.12em] text-white/40 hover:text-white/70"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm font-light text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-sky-400 hover:text-sky-300">
            Create one
          </Link>
        </p>
      </Container>
    </div>
  );
}
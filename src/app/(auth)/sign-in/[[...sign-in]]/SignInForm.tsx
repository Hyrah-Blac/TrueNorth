"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="shrink-0">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M3 6l9 7 9-7" />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// Only ever follow a same-origin, relative path back — never let a
// `redirect_url` query param send a freshly-authenticated session off
// to an arbitrary external host (open-redirect protection). Anything
// that doesn't look like an internal path (no leading "/", or a
// protocol-relative "//host" trying to disguise itself as a path)
// falls back to the homepage.
function getSafeRedirectTarget(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export function SignInForm({ companyName }: { companyName: string }) {
  const { signIn, setActive } = useSignIn();
  const clerk = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  // Purely cosmetic: drives the fade/scale transition when switching
  // between the form and verify stages. Starts false on every stage change
  // and flips true a frame later so the CSS transition actually animates.
  const [stageEntered, setStageEntered] = useState(true);

  // clean up countdown on unmount
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  // ── redirect once Clerk confirms the session ─────────────────────────────
  useEffect(() => {
    if (!userLoaded || !isSignedIn) return;
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace(getSafeRedirectTarget(searchParams.get("redirect_url")));
  }, [userLoaded, isSignedIn, router, searchParams]);

  // ── autofocus the OTP input the moment the verify screen mounts ─────────
  useEffect(() => {
    if (stage === "verify") {
      otpRefs.current[0]?.focus();
    }
  }, [stage]);

  // ── fade/scale transition between stages ─────────────────────────────────
  useEffect(() => {
    setStageEntered(false);
    const frame = requestAnimationFrame(() => setStageEntered(true));
    return () => cancelAnimationFrame(frame);
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

  // Lighter, cleaner field labels — refined from the plain sentence-case
  // caption for a touch more polish (smaller, lower-opacity, wide tracking).
  const labelClass = "mb-2 block text-[13px] font-normal tracking-wide text-white/45";
  // Depth comes from a soft inset shadow rather than raising the fill
  // opacity, and focus uses an inset depth shadow instead of a flat
  // Tailwind ring, for a more refined feel.
  const inputClass =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.05] py-3 pl-11 pr-4 text-sm text-white placeholder-white/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] outline-none focus-visible:outline-none backdrop-blur-sm transition-all duration-300 ease-out focus:border-blue-400/70 focus:bg-white/[0.07] focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]";
  const otpBoxClass =
    "h-12 w-10 rounded-xl border border-white/[0.08] bg-white/[0.05] text-center text-lg font-medium text-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] outline-none focus-visible:outline-none backdrop-blur-sm transition-all duration-300 ease-out focus:scale-105 focus:border-blue-400/70 focus:bg-white/[0.07] focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] disabled:opacity-60 disabled:hover:scale-100 sm:h-14 sm:w-12 sm:text-xl";
  const errorBoxClass =
    "mb-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-sm leading-relaxed text-red-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] backdrop-blur-sm";
  // Fully opaque cover for the browser's built-in autofill tint (usually a
  // yellow background/underline), plus the transition-delay trick as a
  // second, belt-and-braces layer that stops the browser from ever
  // painting the yellow in the first place.
  const autofillFixClass =
    "[&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:inset_0_0_0px_1000px_rgb(15,15,20)] [&:-webkit-autofill]:[caret-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:!border-blue-400/70 [&:-webkit-autofill]:[box-shadow:inset_0_0_0_1px_rgb(108_148_227_/_0.7),inset_0_0_0px_1000px_rgb(15,15,20)]";
  // Same blue accent as before (no new color), just a light press-down on
  // active and smoother easing throughout instead of an instant color swap.
  const primaryButtonClass =
    "w-full justify-center !rounded-xl !py-2.5 text-white outline-none transition-all duration-300 ease-out hover:brightness-105 focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-sky-300/50 focus-visible:!ring-offset-2 focus-visible:!ring-offset-black/60 active:scale-[0.98] active:brightness-95 disabled:opacity-60 disabled:hover:brightness-100 disabled:active:scale-100";
  // Fade/scale transition applied to whichever stage is currently mounted.
  const stageTransitionClass = `transition-all duration-500 ease-out ${
    stageEntered ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-[0.98] opacity-0"
  }`;

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
        className="absolute inset-0 -z-30 scale-110 object-cover blur-[3px]"
      />
      {/* Cinematic vignette — darker at the edges, lighter at the center
          where the card sits — instead of a flat overlay, for more depth
          and separation between the card and the photo. */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_center,rgba(8,10,14,0.4)_0%,rgba(5,6,9,0.78)_100%)]" />

      <Container className="flex w-full flex-col items-center">
        {/* Logo only — no site navbar on this page. */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center transition-opacity duration-300 hover:opacity-80 sm:mb-10"
          aria-label="Go to homepage"
        >
          <Image
            src={LOGO_IMAGE}
            alt={companyName}
            width={160}
            height={40}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        {/* Gradient-border wrapper: a 1px ring of soft white gradient
            (rather than a flat border) around the actual glass card, plus a
            cleaner, wider-spread floating shadow instead of a heavy one. */}
        <div className="w-full max-w-md rounded-[28px] bg-gradient-to-br from-white/25 via-white/[0.06] to-white/10 p-px shadow-[0_25px_70px_-20px_rgba(0,0,0,0.55)]">
          <div className="relative overflow-hidden rounded-[27px] bg-black/55 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] backdrop-blur-2xl backdrop-saturate-150 sm:p-8 lg:p-10">
            <div className="text-center">
              <h1 className="font-display text-[26px] font-semibold tracking-tight text-white sm:text-[32px]">
                {stage === "form" ? "Hello Again" : "Verify Your Email"}
              </h1>
              <p className="mt-3 text-[13.5px] leading-relaxed text-white/45">
                {stage === "form" ? (
                  "Welcome back, you've been missed"
                ) : (
                  <>
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-white/80">{maskEmail(email.trim())}</span>
                  </>
                )}
              </p>
            </div>

            {stage === "form" && (
              <form onSubmit={handleSubmit} noValidate className={`mt-6 ${stageTransitionClass}`}>
                {/* Google — icon only, matching the reference's circular
                    provider button row. */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || loading}
                    aria-label="Continue with Google"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] outline-none transition-all duration-300 ease-out hover:scale-105 hover:border-white/20 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-sky-400/30 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {googleLoading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    ) : (
                      <GoogleIcon />
                    )}
                  </button>
                </div>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-medium text-white/35">Or</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="mb-6">
                  <label htmlFor="email" className={labelClass}>Email</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                      <MailIcon />
                    </span>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value.replace(/^\s+/, ""))}
                      placeholder="name@example.com"
                      className={`${inputClass} ${autofillFixClass}`}
                    />
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
                  variant="blue"
                  size="lg"
                  disabled={loading || googleLoading}
                  className={primaryButtonClass}
                >
                  {loading ? "Logging in…" : "Login"}
                </Button>

                {/* Clerk's bot-protection widget mounts here automatically when
                    Smart CAPTCHA is enabled for the instance — safe to leave
                    even if it's off, Clerk simply renders nothing. */}
                <div id="clerk-captcha" />
              </form>
            )}

            {stage === "verify" && (
              <form onSubmit={handleVerify} noValidate className={`mt-6 ${stageTransitionClass}`}>
                {/* Screen-reader-only announcement for the success transition —
                    the visible cue lives in the submit button below. */}
                <div aria-live="polite" className="sr-only">
                  {verifiedSuccess ? "Verification successful. Signing you in." : ""}
                </div>

                <div className="mb-6">
                  <span className={`${labelClass} text-center`}>Verification code</span>
                  <div
                    className="flex justify-center gap-2.5 sm:gap-3.5"
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
                        className={`${otpBoxClass} ${autofillFixClass}`}
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
                      className={`whitespace-nowrap rounded text-left text-xs font-medium outline-none transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-sky-400/40 xs:text-right ${
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
                  className={primaryButtonClass}
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
                  className="mt-3 w-full rounded text-center text-xs font-medium uppercase tracking-[0.12em] text-white/40 outline-none transition-colors duration-200 ease-out hover:text-white/70 focus-visible:ring-2 focus-visible:ring-sky-400/40"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm font-light text-white/70">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-sky-400 transition-colors duration-200 hover:text-sky-300">
            Sign Up
          </Link>
        </p>
      </Container>
    </div>
  );
}
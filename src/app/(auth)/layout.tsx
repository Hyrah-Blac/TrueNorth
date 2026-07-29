// Route group layout for authentication pages (sign-in, sign-up).
//
// Route groups — folders wrapped in parentheses — don't affect the URL,
// so pages here still resolve to /sign-in and /sign-up. What they DO
// affect is which layout wraps them: this group intentionally has no
// Navbar/Footer, unlike (public)/layout.tsx.
//
// Each auth page (SignInForm, SignUpForm) already renders its own full-screen
// background image, logo, and card, so this layout just passes children
// straight through — it exists only to opt this route group OUT of the
// public layout's chrome.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
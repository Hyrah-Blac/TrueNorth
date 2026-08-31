import { getSiteSettings } from "@/lib/config/siteSettings";
import { Button } from "@/components/shared/buttons/Button";

export default async function GlobalNotFound() {
  const settings = await getSiteSettings();

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">

      {/* Background */}
      <img
        src="/images/gallery/sept.jpg"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 35%" }}
      />

      {/* Washed overlay — matches the maintenance page treatment */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgb(255 255 255 / 0.62) 0%, rgb(252 253 255 / 0.78) 50%, rgb(248 249 252 / 0.90) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-1 flex-col justify-center px-6 sm:px-12 lg:px-20"
        style={{
          paddingTop: "max(2rem, env(safe-area-inset-top, 2rem))",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))",
        }}
      >
        <div style={{ marginTop: "clamp(1rem, 8vh, 4.5rem)" }}>

          {/* Dominant 404 numeral — decorative, the label below is the real heading */}
          <p
            aria-hidden="true"
            className="select-none font-editorial font-light leading-none tracking-tight text-slate-900"
            style={{ fontSize: "clamp(4.5rem, 16vw, 10rem)" }}
          >
            404
          </p>

          {/* Heading */}
          <h1 className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400 sm:text-[10.5px]">
            Page Not Found
          </h1>

          {/* Message */}
          <p
            className="mt-5 text-[13px] leading-relaxed text-slate-500 sm:text-[13.5px]"
            style={{ maxWidth: "42ch" }}
          >
            The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
          </p>

          {/* Spacer between message and action */}
          <div className="mt-8" />

          {/* Action */}
          <Button href="/" variant="outline" size="sm">
            Back to Home
          </Button>

          {/* Contact — wraps gracefully on narrow screens instead of clipping */}
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-loose text-slate-400">
            <a
              href={`tel:${settings.phone}`}
              className="font-medium text-slate-600 underline decoration-slate-200 underline-offset-2 transition-colors hover:text-slate-900"
            >
              {settings.phone}
            </a>
            <span className="hidden select-none text-slate-300 sm:inline">·</span>
            <a
              href={`mailto:${settings.email}`}
              className="font-medium text-slate-600 underline decoration-slate-200 underline-offset-2 transition-colors hover:text-slate-900"
            >
              {settings.email}
            </a>
            <span className="block w-full text-[11px] tracking-wide text-slate-400">
              {settings.operatingHours}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
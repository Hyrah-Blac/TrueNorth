import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/config/siteSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Down for maintenance | ${settings.companyName}`,
    description: `${settings.companyName} is briefly offline for scheduled maintenance.`,
    robots: { index: false, follow: false },
  };
}

export default async function MaintenancePage() {
  const settings = await getSiteSettings();
  const message = settings.maintenanceMode.message;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">

      {/* Background */}
      <img
        src="/images/gallery/sept.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 35%" }}
      />

      {/* Washed overlay — heavier than before, still lets the image read */}
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
        <div style={{ marginTop: "10vh" }}>

          {/* Eyebrow */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:text-[10.5px]">
            Scheduled Maintenance
          </p>

          {/* Headline */}
          <h1
            className="mt-3 font-editorial font-light leading-[1.06] tracking-tight text-slate-900"
            style={{ fontSize: "clamp(2rem, 5.5vw, 4rem)" }}
          >
            {settings.companyShortName} is briefly grounded
          </h1>

          {/* Message — only when set by admin */}
          {message && (
            <p
              className="mt-4 text-[13px] leading-relaxed text-slate-500 sm:text-[13.5px]"
              style={{ maxWidth: "42ch" }}
            >
              {message}
            </p>
          )}

          {/* Spacer between content and contact */}
          <div className="mt-8" />

          {/* Contact */}
          <p className="text-[12px] leading-loose text-slate-400">
            <a
              href={`tel:${settings.phone}`}
              className="font-medium text-slate-600 underline decoration-slate-200 underline-offset-2 transition-colors hover:text-slate-900"
            >
              {settings.phone}
            </a>
            <span className="mx-2 select-none text-slate-300">·</span>
            <a
              href={`mailto:${settings.email}`}
              className="font-medium text-slate-600 underline decoration-slate-200 underline-offset-2 transition-colors hover:text-slate-900"
            >
              {settings.email}
            </a>
            <span className="mt-1 block text-[11px] tracking-wide text-slate-400">
              {settings.operatingHours}
            </span>
          </p>

        </div>
      </div>

      <meta httpEquiv="refresh" content="60" />
    </div>
  );
}
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { getSiteSettings, type ResolvedSiteSettings } from "@/lib/config/siteSettings";

interface ContactInfoCardProps {
  /** Pass settings down if the parent already fetched them, to avoid a duplicate DB call. */
  settings?: ResolvedSiteSettings;
}

export async function ContactInfoCard({ settings: settingsProp }: ContactInfoCardProps = {}) {
  const settings = settingsProp ?? (await getSiteSettings());

  const items = [
    // ...unchanged from here down
    {
      icon: MapPin,
      label: "Office",
      value: `${settings.addressLine1}${settings.addressLine2 ? `, ${settings.addressLine2}` : ""}, ${settings.city}`,
    },
    { icon: Phone, label: "Phone", value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, "")}` },
    { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    { icon: Clock, label: "Hours", value: settings.operatingHours },
  ];

  return (
    <div className="rounded-xl border border-navy-800 bg-navy-950 p-8 shadow-soft">
      <h2 className="font-editorial text-2xl font-light italic text-white">Get in touch</h2>
      <div className="mt-7 space-y-6">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-400">
              <item.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-widest2 text-slate-400">{item.label}</p>
              {item.href ? (
                <a href={item.href} className="text-sm font-medium text-white transition-colors hover:text-sky-400">
                  {item.value}
                </a>
              ) : (
                <p className="text-sm font-medium text-white">{item.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-md border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-slate-300">
        For time-critical medical evacuation requests, call our dispatch line directly rather
        than using this form.
      </div>
    </div>
  );
}

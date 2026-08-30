import { Phone, Mail, MapPin, Clock, MessageCircle, Navigation } from "lucide-react";
import { CardActionLink } from "./CardActionLink";
import type { CompanyInfo } from "../../types";

function whatsAppHref(whatsapp: string) {
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
}

function directionsHref(company: CompanyInfo) {
  const query = encodeURIComponent(`${company.address}, ${company.city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function CompanyInfoCard({ company }: { company: CompanyInfo }) {
  const rows = [
    { Icon: Phone, label: company.phone, href: `tel:${company.phone.replace(/\s/g, "")}` },
    { Icon: Mail, label: company.email, href: `mailto:${company.email}` },
    company.address ? { Icon: MapPin, label: `${company.address}, ${company.city}`, href: undefined } : null,
    { Icon: Clock, label: company.operatingHours, href: undefined },
  ].filter((row): row is { Icon: typeof Phone; label: string; href?: string } => Boolean(row));

  const quickActions = [
    { Icon: Phone, label: "Call", href: `tel:${company.phone.replace(/\s/g, "")}` },
    company.whatsapp ? { Icon: MessageCircle, label: "WhatsApp", href: whatsAppHref(company.whatsapp) } : null,
    { Icon: Mail, label: "Email", href: `mailto:${company.email}` },
    company.address ? { Icon: Navigation, label: "Directions", href: directionsHref(company) } : null,
  ].filter((action): action is { Icon: typeof Phone; label: string; href: string } => Boolean(action));

  return (
    // Flat, flush card — no elevation shadow.
    <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-5">
      <h4 className="font-editorial text-[18px] font-normal tracking-[-0.012em] text-navy-900">{company.shortName}</h4>

      <dl className="mt-3 space-y-2.5">
        {rows.map((row, index) => (
          <div key={index} className="flex items-start gap-2.5">
            <row.Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
            {row.href ? (
              <a href={row.href} className="font-body text-xs leading-relaxed text-slate-700 hover:text-blue-600">
                {row.label}
              </a>
            ) : (
              <span className="font-body text-xs leading-relaxed text-slate-700">{row.label}</span>
            )}
          </div>
        ))}
      </dl>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {quickActions.map(({ Icon, label, href }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 py-2.5 transition-colors duration-300 hover:border-blue-200 hover:bg-blue-50/40"
          >
            {/* Same blue rounded-lg badge used for the airport marker
                elsewhere in the concierge, rather than a bare icon
                floating on the tile — ties this card into the rest of
                the system instead of reading as a generic action grid. */}
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <span className="font-display text-[9px] font-medium uppercase tracking-widest2 text-slate-500 group-hover:text-blue-600">
              {label}
            </span>
          </a>
        ))}
      </div>

      <div className="mt-3">
        <CardActionLink href="/contact" variant="outline">
          Contact Us
        </CardActionLink>
      </div>
    </div>
  );
}
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { CardActionLink } from "./CardActionLink";
import type { CompanyInfo } from "../../types";

function whatsAppHref(whatsapp: string) {
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
}

export function CompanyInfoCard({ company }: { company: CompanyInfo }) {
  const rows = [
    { Icon: Phone, label: company.phone, href: `tel:${company.phone.replace(/\s/g, "")}` },
    { Icon: Mail, label: company.email, href: `mailto:${company.email}` },
    company.address ? { Icon: MapPin, label: `${company.address}, ${company.city}`, href: undefined } : null,
    { Icon: Clock, label: company.operatingHours, href: undefined },
  ].filter((row): row is { Icon: typeof Phone; label: string; href?: string } => Boolean(row));

  return (
    <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-crisp">
      <h4 className="font-display text-sm font-semibold text-navy-900">{company.shortName}</h4>

      <dl className="mt-3 space-y-2.5">
        {rows.map((row, index) => (
          <div key={index} className="flex items-start gap-2.5">
            <row.Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden="true" />
            {row.href ? (
              <a href={row.href} className="text-xs leading-relaxed text-slate-700 hover:text-sky-600">
                {row.label}
              </a>
            ) : (
              <span className="text-xs leading-relaxed text-slate-700">{row.label}</span>
            )}
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <CardActionLink href="/contact" variant="outline">
          Contact Us
        </CardActionLink>
        {company.whatsapp ? (
          <CardActionLink href={whatsAppHref(company.whatsapp)} variant="primary" external>
            WhatsApp
          </CardActionLink>
        ) : null}
      </div>
    </div>
  );
}

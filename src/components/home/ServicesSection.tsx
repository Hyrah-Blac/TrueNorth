"use client";

import { Briefcase, Bank, Heartbeat, Compass, Mountains, Camera, type Icon } from "@phosphor-icons/react";
import { Section, SectionHeading } from "@/components/layout/section/Section";
import { services } from "@/content/services";

const iconMap: Record<string, Icon> = {
  briefcase: Briefcase,
  landmark: Bank,
  "heart-pulse": Heartbeat,
  compass: Compass,
  mountain: Mountains,
  camera: Camera,
};

export function ServicesSection() {
  return (
    <Section tone="slate">
      <SectionHeading
        eyebrow="Who We Fly For"
        title="Built for the work Kenya actually does in the air"
        description="From boardrooms to bush airstrips — every sector below books through the same charter request process."
      />

      <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-sm bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const Icon = iconMap[service.icon];
          return (
            <div key={service.title} className="flex flex-col bg-white p-8 lg:p-10">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-100 text-sky-600">
                <Icon className="h-5 w-5" weight="thin" aria-hidden="true" />
              </span>
              <div className="mt-5 h-px w-8 bg-slate-200" />
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-navy-900">
                {service.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{service.description}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
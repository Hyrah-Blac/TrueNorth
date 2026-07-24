import Image from "next/image";

export function FleetHero() {
  return (
    <div className="relative overflow-hidden border-b border-navy-800 bg-navy-950 py-20 lg:py-28">
      <Image
        src="/images/aircraft/interiors/Interior.jpg"
        alt=""
        fill
        priority
        className="animate-zoom-slow object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/40" />
      <div className="relative mx-auto max-w-container px-6 lg:px-10">
        <p className="spec-readout mb-3 animate-fade-up-editorial text-xs font-medium uppercase tracking-widest2 text-sky-400">
          The Fleet
        </p>
        <h1
          className="animate-fade-up-editorial font-editorial text-4xl font-light tracking-tight text-white lg:text-5xl"
          style={{ animationDelay: "100ms" }}
        >
          Seven aircraft categories, matched to the mission
        </h1>
        <p
          className="mt-4 max-w-2xl animate-fade-up-editorial text-base leading-relaxed text-slate-300"
          style={{ animationDelay: "200ms" }}
        >
          Filter by category or passenger count, or submit a charter request and we&apos;ll
          recommend the right aircraft for your trip.
        </p>
      </div>
    </div>
  );
}

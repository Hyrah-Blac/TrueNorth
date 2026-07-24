export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  sector: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "We needed a site visit team moved to a remote pit and back in the same day, with no fixed strip nearby. The helicopter option made that possible, and the whole process from quote to wheels-up took under 48 hours.",
    name: "Operations Lead",
    role: "Regional mining operation",
    sector: "Mining & Industrial",
  },
  {
    quote:
      "Our program covers three counties with no reliable road access between them. Having a charter partner who understands NGO budgets and remote airstrips, not just VIP transfers, has changed how we plan field visits.",
    name: "Program Director",
    role: "Humanitarian relief organization",
    sector: "NGO & Humanitarian",
  },
  {
    quote:
      "A guest needed evacuation from our camp outside normal road-access hours. Dispatch had a medevac-configured aircraft in the air within the hour. That kind of readiness is what we build our safety plan around.",
    name: "Camp Manager",
    role: "Private safari conservancy",
    sector: "Safari & Tourism",
  },
  {
    quote:
      "We fly a small executive team between Nairobi and regional offices most weeks. The turboprop option keeps it efficient without the overhead of a larger jet we don't need for the route.",
    name: "Head of Operations",
    role: "Regional logistics firm",
    sector: "Business Charter",
  },
];

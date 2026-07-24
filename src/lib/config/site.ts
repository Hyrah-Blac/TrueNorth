export const siteConfig = {
  name: "True North Charters",
  shortName: "True North",
  tagline: "Charter aviation, built for Kenya's work",
  description:
    "True North Charters operates helicopters, turboprops, light jets, and medevac aircraft across Kenya and East Africa — for business, government, NGO, safari, and emergency missions.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  email: "operations@truenorthcharters.co.ke",
  phone: "+254 700 000 000",
  phoneDisplay: "+254 700 000 000",
  whatsapp: "+254700000000",
  address: {
    line1: "Wilson Airport, General Aviation Terminal",
    line2: "Langata Road",
    city: "Nairobi",
    country: "Kenya",
  },
  operatingHours: "Dispatch desk: 24 / 7 · Offices: Mon–Sat, 07:00–19:00 EAT",
  certifications: ["KCAA AOC Certified", "IS-BAO Registered", "ISAGO Compliant"],
} as const;

export type SiteConfig = typeof siteConfig;

// The 4th stat used to assert "KCAA / AOC certified" as a hardcoded fact.
// That's a specific regulatory claim this content file can't verify, and
// asserting it incorrectly is false-advertising risk, not just a copy
// nitpick — so it's replaced with a fact that's true by construction
// (the base airport, already shown elsewhere in siteSettings). If/when
// the operator confirms actual certifications, surface them from
// siteSettings (admin-configurable) rather than hardcoding them here.
export const companyStats = [
  { value: "7", label: "Aircraft categories" },
  { value: "18+", label: "Destinations served" },
  { value: "24/7", label: "Dispatch desk" },
  { value: "WIL", label: "Home base, Nairobi" },
] as const;

export const companyFacts = {
  foundedContext: "Operating scheduled and on-demand charter across Kenya and East Africa.",
  baseAirport: "Wilson Airport, Nairobi (WIL)",
  fleetCategories: [
    "Helicopters",
    "Executive turboprops",
    "Light business jets",
    "Utility aircraft",
    "Medical evacuation aircraft",
    "Safari aircraft",
    "Cargo aircraft",
  ],
} as const;

export interface NavLink {
  label: string;
  href: string;
}

export const mainNav: NavLink[] = [
  { label: "Fleet", href: "/fleet" },
  { label: "Destinations", href: "/destinations" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Safety Standards", href: "/about#safety" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Charter",
    links: [
      { label: "Browse Fleet", href: "/fleet" },
      { label: "Destinations", href: "/destinations" },
      { label: "Request a Quote", href: "/request-charter" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: "/sign-in" },
      { label: "My Bookings", href: "/dashboard/bookings" },
      { label: "My Quotes", href: "/dashboard/quotes" },
    ],
  },
];

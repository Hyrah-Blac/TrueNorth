export interface SocialLink {
  platform: "instagram" | "linkedin" | "facebook" | "x";
  label: string;
  href: string;
}

export const socialLinks: SocialLink[] = [
  { platform: "linkedin", label: "LinkedIn", href: "https://linkedin.com" },
  { platform: "instagram", label: "Instagram", href: "https://instagram.com" },
  { platform: "facebook", label: "Facebook", href: "https://facebook.com" },
  { platform: "x", label: "X (Twitter)", href: "https://x.com" },
];

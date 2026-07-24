export interface ServiceContent {
  icon: "briefcase" | "shield" | "heart-pulse" | "camera" | "mountain" | "landmark" | "compass";
  title: string;
  description: string;
}

export const services: ServiceContent[] = [
  {
    icon: "briefcase",
    title: "Business Charter",
    description:
      "Point-to-point flights that turn a full-day drive into a same-day meeting, with departure times set around your schedule.",
  },
  {
    icon: "landmark",
    title: "Government & Diplomatic",
    description: "Cleared operations for government agencies, county missions, and diplomatic movement across the region.",
  },
  {
    icon: "heart-pulse",
    title: "Medical Evacuation",
    description: "Stretcher-equipped aircraft on standby for inter-facility transfers and emergency response.",
  },
  {
    icon: "compass",
    title: "Safari & Tourism",
    description: "Scenic charters into bush airstrips near Kenya's national parks and private conservancies.",
  },
  {
    icon: "mountain",
    title: "Mining & Industrial",
    description: "Scheduled and on-demand access to remote sites, including personnel rotation and light cargo.",
  },
  {
    icon: "camera",
    title: "Film & Media",
    description: "Aerial platforms and location transport for production crews working across varied terrain.",
  },
];

export interface WhyChooseUsPoint {
  title: string;
  description: string;
}

export const whyChooseUs: WhyChooseUsPoint[] = [
  {
    title: "KCAA-certified operation",
    description: "Every aircraft and crew operates under a full Kenya Civil Aviation Authority Air Operator Certificate.",
  },
  {
    title: "A fleet matched to the mission",
    description: "Helicopters, turboprops, jets, and utility aircraft — we recommend what actually fits the trip, not just what's available.",
  },
  {
    title: "Dispatch on call",
    description: "Our operations desk is staffed around the clock for time-sensitive and emergency charter requests.",
  },
  {
    title: "Transparent quoting",
    description: "Every charter is priced for its actual mission profile — you'll always see what a quote covers before you commit.",
  },
];

import { dashboardSerif } from "@/lib/fonts/dashboard-serif";

/**
 * Re-exported from the shared dashboard serif font (see
 * src/lib/fonts/dashboard-serif.ts) to avoid a duplicate Google Fonts
 * fetch at build time. Keeps the original `bookingSerif` name so nothing
 * elsewhere needs to change.
 */
export const bookingSerif = dashboardSerif;

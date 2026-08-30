import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/config/siteSettings";

// Middleware can't talk to MongoDB directly — Next.js Middleware runs in
// the Edge runtime by default, which doesn't support the TCP sockets
// Mongoose needs. So instead of middleware querying the database itself,
// it fetches this ordinary Route Handler (which runs in the standard
// Node.js runtime, same as the rest of the app) and caches the small
// JSON response for a few seconds.
//
// That short cache is a deliberate trade-off: it means a freshly-flipped
// toggle can take up to ~10s to apply to a given edge location, instead
// of being instant. In exchange, this endpoint doesn't add a database
// round-trip to every single page view on the site.
export async function GET() {
  const settings = await getSiteSettings();

  return NextResponse.json(
    {
      enabled: settings.maintenanceMode.enabled,
      message: settings.maintenanceMode.message ?? null,
    },
    {
      headers: {
        // s-maxage: cached at Vercel's edge for 10s. stale-while-revalidate:
        // a stale copy keeps being served for another 50s while a fresh
        // one is fetched in the background, so a slow DB never turns into
        // a slow (or failed) request on the critical path of every page load.
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=50",
      },
    }
  );
}
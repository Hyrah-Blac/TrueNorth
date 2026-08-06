import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://c081605d90add72665c73f005951b08b@o4511865337872384.ingest.us.sentry.io/4511865344098304",
  environment: process.env.NODE_ENV,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  debug: false,
});
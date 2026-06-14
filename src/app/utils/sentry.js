import * as Sentry from "@sentry/react";

const dsn = process.env.REACT_APP_SENTRY_DSN;

export function initSentry() {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.REACT_APP_SENTRY_RELEASE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: Number(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE || 0.1),
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === "console") {
        const msg = breadcrumb.message || "";
        if (/password|token|authorization/i.test(msg)) return null;
      }
      return breadcrumb;
    },
  });
}

export { Sentry };

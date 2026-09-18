import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  // Nunca anexar IP, cookies ou headers de request por padrão — o app trata
  // fotos, bio e respostas do questionário como dados sensíveis (CLAUDE.md).
  sendDefaultPii: false,
});

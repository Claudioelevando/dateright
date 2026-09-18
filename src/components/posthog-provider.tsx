"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (typeof window !== "undefined" && key) {
  posthog.init(key, {
    api_host: host,
    ui_host: "https://us.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    // Autocapture registra texto/atributos de cliques e inputs do DOM — nesse app
    // isso inclui bio, respostas do questionário e mensagens de chat. Desligado;
    // só rastreamos $pageview manualmente.
    autocapture: false,
    disable_session_recording: true,
  });
}

function PageViewTracker() {
  const posthogClient = usePostHog();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthogClient || !pathname) return;

    const search = searchParams.toString();
    posthogClient.capture("$pageview", {
      $current_url: search ? `${pathname}?${search}` : pathname,
    });
  }, [posthogClient, pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!key) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}

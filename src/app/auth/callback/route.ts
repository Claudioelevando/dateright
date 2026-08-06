import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  // Só aceita caminhos relativos internos — evita open redirect via "//evil.com" (protocol-
  // relative), "/\evil.com" (browsers normalizam \ pra /) ou "@evil.com" (userinfo trick),
  // que fariam a URL final resolver pra outro host.
  const isSafeNext = (value: string | null): value is string => !!value && /^\/(?!\/|\\)/.test(value);
  const next = isSafeNext(rawNext) ? rawNext : "/profile";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;

  const profile = userId
    ? await prisma.profile.findUnique({ where: { id: userId }, select: { role: true } })
    : null;

  if (!profile || profile.role === "USER") {
    redirect("/");
  }

  return <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">{children}</div>;
}

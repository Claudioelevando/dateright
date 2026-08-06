"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/", label: "Início" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/questionnaire", label: "Questionário" },
  { href: "/discover", label: "Descobrir" },
  { href: "/matches", label: "Matches" },
  { href: "/profile", label: "Perfil" },
  { href: "/design-system", label: "Design System" },
];

const authRoutes = ["/login", "/cadastro", "/recuperar-senha"];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = authRoutes.includes(pathname ?? "");

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-6">
        <Link href="/" aria-label="DateRight — início">
          <Logo />
        </Link>

        {!isAuthRoute && (
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-1">
          {!isAuthRoute && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sair"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" />
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

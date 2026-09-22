"use client";

import type React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClipboardList, FileText, Loader2, LogOut, ShoppingBag, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/client/mon-compte", label: "Mon compte", icon: UserCircle },
  { href: "/client/mes-commandes", label: "Commandes", icon: ClipboardList },
  { href: "/client/mes-demandes", label: "Demandes", icon: FileText },
];

export function ClientShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (isAdmin) {
      router.replace("/admin");
    }
  }, [isAdmin, loading, pathname, router, user]);

  if (loading || !user || isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="brand-surface flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fffaf0_0%,#ffffff_42%,#eef8f5_100%)]">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
        <div className="container-page flex min-h-16 flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-2 font-black">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ShoppingBag className="h-4 w-4" />
            </span>
            BOUTIQUE NA BISO
          </Link>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex whitespace-nowrap items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => signOut()}
              className="inline-flex whitespace-nowrap items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      <main className="container-page py-6 md:py-8">{children}</main>
    </div>
  );
}

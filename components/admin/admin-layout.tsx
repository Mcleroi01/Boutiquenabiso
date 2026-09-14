"use client";

import type React from "react";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/categories", label: "Catégories", icon: FolderTree },
  { href: "/admin/commandes", label: "Commandes", icon: ClipboardList },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && pathname !== "/admin/login" && (!user || !isAdmin)) {
      router.replace("/login?error=not-admin");
    }
  }, [user, isAdmin, loading, pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="brand-surface flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Chargement de l'administration...
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fffaf0_0%,#ffffff_42%,#eef8f5_100%)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/70 bg-white/90 shadow-sm shadow-slate-900/5 backdrop-blur-xl md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border/70 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-black">BOUTIQUE NA BISO</span>
            <span className="mt-1 text-[10px] font-medium text-muted-foreground">
              Administration
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border/70 p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            Voir le catalogue
          </Link>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-white">
              <ShoppingBag className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-black">Admin</span>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto px-2 pb-2 no-scrollbar">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex whitespace-nowrap items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="md:pl-64">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

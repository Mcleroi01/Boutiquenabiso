"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Home, Menu, ShoppingBag, UserCircle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Catalogue", icon: Home },
  { href: "/devis", label: "Demander un devis", icon: FileText },
  { href: "/client/mon-compte", label: "Mon compte", icon: UserCircle },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-white/90 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-base font-black tracking-tight">
              BOUTIQUE NA BISO
            </span>
            <span className="mt-1 truncate text-[11px] font-medium text-muted-foreground">
              Chine - Kinshasa
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl border border-border/70 bg-muted/50 p-1 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all",
                  active
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-white/70 hover:text-foreground",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white shadow-sm transition-colors hover:bg-muted md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <nav className="animate-fade-in border-t border-border/70 bg-white px-4 py-3 md:hidden">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}

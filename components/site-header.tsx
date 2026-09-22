"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, UserCircle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/#catalogue", label: "Catalogue" },
  { href: "/devis", label: "Demander un devis" },
  { href: "/client/mon-compte", label: "Mon compte" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/95 backdrop-blur-xl">
      <div className="container-page">
        <div className="grid h-[4.5rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
          <Link href="/" className="min-w-0 max-w-full justify-self-start">
            <span className="block truncate text-base font-semibold tracking-[-0.02em] text-primary sm:text-lg">
              BOUTIQUE NA BISO
            </span>
            <span className="hidden text-[10px] font-medium tracking-[0.08em] text-muted-foreground sm:block">
              CHINE · KINSHASA
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-self-end gap-3">
            <button
              className="hidden h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted md:flex"
              aria-label="Rechercher"
            >
              <Search className="h-4 w-4" />
            </button>
            <Link
              href="/client/mon-compte"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted md:flex"
              aria-label="Mon compte"
            >
              <UserCircle className="h-4 w-4" />
            </Link>
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-white transition-colors hover:bg-muted md:hidden"
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
        </div>

        {mobileOpen && (
          <nav className="animate-fade-in border-t border-border/70 px-4 py-3 md:hidden">
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
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

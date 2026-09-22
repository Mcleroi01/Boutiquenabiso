"use client";

import type React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  Loader2,
  UserCircle,
} from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard-shell";
import { useAuth } from "@/lib/auth";

const navItems: DashboardNavItem[] = [
  { href: "/client/mon-compte", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/client/mes-informations", label: "Mes informations", icon: UserCircle },
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
    <DashboardShell
      navItems={navItems}
      areaLabel="Espace client"
      mobileLabel="Client"
      onSignOut={signOut}
    >
      {children}
    </DashboardShell>
  );
}

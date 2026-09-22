"use client";

import type React from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  Contact,
  FileText,
  FolderTree,
  LayoutDashboard,
  Loader2,
  Package,
  Settings,
} from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard-shell";
import { useAuth } from "@/lib/auth";

const navItems: DashboardNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/categories", label: "Catégories", icon: FolderTree },
  { href: "/admin/commandes", label: "Commandes", icon: ClipboardList },
  { href: "/admin/clients", label: "Clients", icon: Contact },
  { href: "/admin/devis", label: "Demandes de devis", icon: FileText },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isAdmin) {
      router.replace("/client/mon-compte");
    }
  }, [user, isAdmin, loading, pathname, router]);

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
    <DashboardShell
      navItems={navItems}
      areaLabel="Administration"
      mobileLabel="Admin"
      onSignOut={signOut}
    >
      {children}
    </DashboardShell>
  );
}

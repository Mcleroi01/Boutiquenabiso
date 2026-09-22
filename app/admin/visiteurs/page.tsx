"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Eye,
  Globe2,
  Laptop,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  UserCheck,
  Users,
} from "lucide-react";
import { getVisitorAnalytics, type VisitorAnalytics } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function VisitorsPage() {
  const [analytics, setAnalytics] = useState<VisitorAnalytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getVisitorAnalytics()
      .then(setAnalytics)
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Impossible de charger les visiteurs.",
        ),
      );
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Chargement des visiteurs...
      </div>
    );
  }

  const stats = [
    {
      label: "Visiteurs uniques",
      value: analytics.totalVisitors,
      detail: "Toutes les visites connues",
      icon: Users,
      color: "text-indigo-700 bg-indigo-50 ring-indigo-100",
    },
    {
      label: "Actifs aujourd'hui",
      value: analytics.activeVisitors,
      detail: "Dernières 24 heures",
      icon: Activity,
      color: "text-emerald-700 bg-emerald-50 ring-emerald-100",
    },
    {
      label: "Pages vues",
      value: analytics.totalPageViews,
      detail: "Dernières 24 heures",
      icon: Eye,
      color: "text-sky-700 bg-sky-50 ring-sky-100",
    },
    {
      label: "Avec un compte",
      value: analytics.authenticatedVisitors,
      detail: "Visiteurs identifiés",
      icon: UserCheck,
      color: "text-primary bg-teal-50 ring-teal-100",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Analyse du site
        </p>
        <h1 className="text-3xl font-black tracking-tight">Visiteurs</h1>
        <p className="text-sm text-muted-foreground">
          Comprenez les parcours de visite et les pages qui intéressent vos
          clients.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="brand-surface rounded-2xl p-4">
            <div
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1",
                stat.color,
              )}
            >
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="mt-4 text-xs font-bold text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-black tracking-tight">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className="brand-surface rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Pages les plus vues</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Sur les dernières 24 heures
              </p>
            </div>
            <Globe2 className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-5 space-y-4">
            {analytics.topPages.length > 0 ? (
              analytics.topPages.map((page, index) => {
                const maxViews = analytics.topPages[0]?.views || 1;
                return (
                  <div key={page.path}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-semibold">
                        <span className="mr-2 text-xs text-muted-foreground">
                          {index + 1}
                        </span>
                        {page.path}
                      </span>
                      <span className="shrink-0 font-black text-primary">
                        {page.views}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{
                          width: `${Math.max(8, (page.views / maxViews) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Les premières visites apparaîtront ici.
              </p>
            )}
          </div>
        </section>

        <section className="brand-surface overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 p-5 md:p-6">
            <div>
              <h2 className="text-base font-bold">Visiteurs récents</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Activité la plus récente
              </p>
            </div>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          {analytics.recentVisitors.length > 0 ? (
            <div className="divide-y divide-border/70">
              {analytics.recentVisitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <DeviceIcon device={visitor.device_type} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">
                          {visitor.user_id
                            ? visitor.user_name || "Client connecté"
                            : "Visiteur anonyme"}
                        </p>
                        {visitor.user_id && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            Compte
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {visitor.user_id && visitor.user_email
                          ? `${visitor.user_email} · `
                          : ""}
                        Dernière page : {visitor.last_path}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground sm:text-right">
                    <span>{visitor.page_views} pages</span>
                    <span>{formatRelativeTime(visitor.last_seen_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Aucun visiteur enregistré pour le moment.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function DeviceIcon({ device }: { device: string }) {
  if (device === "mobile") return <Smartphone className="h-4 w-4" />;
  if (device === "tablet") return <Tablet className="h-4 w-4" />;
  if (device === "desktop") return <Monitor className="h-4 w-4" />;
  return <Laptop className="h-4 w-4" />;
}

function formatRelativeTime(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  return new Date(value).toLocaleDateString("fr-FR");
}

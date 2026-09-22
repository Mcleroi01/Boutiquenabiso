"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  ClipboardList,
  Clock3,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { ClientShell } from "@/components/client/client-shell";
import { getClientNotifications, getClientOrders } from "@/lib/data";
import {
  Order,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export default function MyAccountPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; message: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getClientOrders(), getClientNotifications()])
      .then(([clientOrders, clientNotifications]) => {
        setOrders(clientOrders);
        setNotifications(clientNotifications);
      })
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Impossible de charger le tableau de bord.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const active = orders.filter(
    (order) => !["delivered", "cancelled"].includes(order.status),
  ).length;

  if (loading) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
          Chargement...
        </div>
      </ClientShell>
    );
  }

  return (
    <ClientShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Espace client
          </p>
          <h1 className="text-3xl font-black tracking-tight">Mon compte</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos informations et suivez vos commandes.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Commandes",
              value: orders.length,
              icon: ClipboardList,
              color: "text-indigo-700 bg-indigo-50 ring-indigo-100",
            },
            {
              label: "En cours",
              value: active,
              icon: Clock3,
              color: "text-amber-700 bg-amber-50 ring-amber-100",
            },
            {
              label: "Notifications",
              value: notifications.length,
              icon: Bell,
              color: "text-primary bg-teal-50 ring-teal-100",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="brand-surface rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1",
                  stat.color,
                )}
              >
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 text-xl font-black tracking-tight">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="brand-surface overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 p-5">
            <div>
              <h2 className="text-base font-bold">Commandes récentes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Suivez l&apos;avancement de vos dernières commandes.
              </p>
            </div>
            <Link
              href="/client/mes-commandes"
              className="text-sm font-bold text-primary hover:underline"
            >
              Voir tout
            </Link>
          </div>
          {orders.length > 0 ? (
            <div className="divide-y divide-border/70">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-bold">
                      {order.order_number || order.id}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.product_name} x {order.quantity}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-black">
                      {formatPrice(order.price * order.quantity)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold",
                        ORDER_STATUS_COLORS[order.status],
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="mb-2 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Aucune commande pour le moment.
              </p>
              <Link
                href="/"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                <ShoppingBag className="h-4 w-4" />
                Voir le catalogue
              </Link>
            </div>
          )}
        </div>

        <div className="brand-surface rounded-2xl p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Accès rapides</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Retrouvez vos activités client.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold transition-colors hover:bg-muted"
                href="/client/mes-commandes"
              >
                Mes commandes
              </Link>
              <Link
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold transition-colors hover:bg-muted"
                href="/client/mes-demandes"
              >
                Mes demandes
              </Link>
              <Link
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold transition-colors hover:bg-muted"
                href="/client/mes-informations"
              >
                Mes informations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ClientShell>
  );
}

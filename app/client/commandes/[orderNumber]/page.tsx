"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  CircleDot,
  Clock3,
  MapPin,
  Package,
  Plane,
  Truck,
  Warehouse,
} from "lucide-react";
import { ClientShell } from "@/components/client/client-shell";
import { getClientOrderByNumber, getClientOrderHistory } from "@/lib/data";
import {
  Order,
  OrderStatus,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const trackingSteps: { status: OrderStatus; icon: typeof Package }[] = [
  { status: "pending", icon: CircleDot },
  { status: "confirmed", icon: BadgeCheck },
  { status: "purchasing", icon: Package },
  { status: "shipping_to_agency", icon: Plane },
  { status: "arrived_at_agency", icon: Warehouse },
  { status: "in_transit", icon: Truck },
  { status: "arrived_in_kinshasa", icon: MapPin },
  { status: "ready_for_delivery", icon: CalendarDays },
  { status: "delivered", icon: Check },
];

type OrderHistory = {
  id: string;
  status: string;
  comment: string | null;
  created_at: string;
};

export default function OrderTrackingPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderHistory[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getClientOrderByNumber(params.orderNumber)
      .then(async (found) => {
        if (!found) {
          setError("Commande introuvable.");
          return;
        }
        setOrder(found);
        setHistory(await getClientOrderHistory(found.id));
      })
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "Impossible de charger le suivi.",
        ),
      );
  }, [params.orderNumber]);

  if (error) {
    return (
      <ClientShell>
        <div className="mx-auto max-w-3xl rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
          {error}
        </div>
      </ClientShell>
    );
  }

  if (!order) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Clock3 className="mr-2 h-5 w-5 animate-pulse text-primary" />
          Chargement du suivi...
        </div>
      </ClientShell>
    );
  }

  return <TrackingContent order={order} history={history} />;
}

function TrackingContent({
  order,
  history,
}: {
  order: Order;
  history: OrderHistory[];
}) {
  const currentIndex = trackingSteps.findIndex((step) => step.status === order.status);
  const isCancelled = order.status === "cancelled";
  const historyByStatus = useMemo(
    () => new Map(history.map((entry) => [entry.status, entry])),
    [history],
  );
  const progress = isCancelled
    ? 0
    : Math.max(0, Math.round(((currentIndex + 1) / trackingSteps.length) * 100));

  return (
    <ClientShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="animate-slide-up flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Suivi de commande
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              {order.order_number || "Commande"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Votre commande, étape par étape jusqu&apos;à la livraison.
            </p>
          </div>
          <span
            className={cn(
              "inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-bold",
              ORDER_STATUS_COLORS[order.status],
            )}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </header>

        <section className="brand-surface animate-slide-up overflow-hidden rounded-2xl p-5 md:p-6 [animation-delay:80ms]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Package className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-black">{order.product_name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quantité : {order.quantity} · {formatPrice(order.price * order.quantity)}
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Progression
              </p>
              <p className="mt-1 text-2xl font-black text-primary">{progress}%</p>
            </div>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <section className="brand-surface animate-slide-up rounded-2xl p-5 md:p-6 [animation-delay:160ms]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">Étapes de livraison</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isCancelled
                    ? "Cette commande a été annulée."
                    : "Nous mettons à jour votre parcours au fur et à mesure."}
                </p>
              </div>
              <Truck className="h-5 w-5 text-primary" />
            </div>

            {isCancelled ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Le suivi est arrêté pour cette commande.
              </div>
            ) : (
              <div className="relative mt-7 space-y-0">
                <div className="absolute bottom-6 left-[19px] top-6 w-px bg-border" />
                {trackingSteps.map(({ status, icon: Icon }, index) => {
                  const entry = historyByStatus.get(status);
                  const done = index <= currentIndex;
                  const current = index === currentIndex;
                  return (
                    <div
                      key={status}
                      className="relative flex gap-4 pb-6 last:pb-0 animate-slide-up"
                      style={{ animationDelay: `${220 + index * 55}ms` }}
                    >
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white transition-all duration-500",
                          done
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                            : "bg-muted text-muted-foreground",
                          current && "ring-4 ring-primary/15",
                        )}
                      >
                        <Icon className={cn("h-4 w-4", current && "animate-pulse")} />
                      </div>
                      <div className="min-w-0 flex-1 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={cn("text-sm font-bold", !done && "text-muted-foreground")}>
                            {ORDER_STATUS_LABELS[status]}
                          </p>
                          {current && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-primary">
                              En cours
                            </span>
                          )}
                        </div>
                        {entry ? (
                          <>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleString("fr-FR")}
                            </p>
                            {entry.comment && (
                              <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                                {entry.comment}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            À venir
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="brand-surface animate-slide-up rounded-2xl p-5 [animation-delay:220ms]">
              <h2 className="text-base font-bold">Détails de livraison</h2>
              <div className="mt-4 space-y-4 text-sm">
                <Detail icon={MapPin} label="Destination" value={order.delivery_city || "À confirmer"} />
                <Detail icon={Truck} label="Transporteur" value={order.carrier || "À confirmer"} />
                <Detail icon={Package} label="Numéro de suivi" value={order.tracking_number || "À confirmer"} />
                <Detail icon={CalendarDays} label="Livraison estimée" value={order.estimated_delivery || "À confirmer"} />
              </div>
            </section>

            <section className="rounded-2xl bg-slate-950 p-5 text-white shadow-lg shadow-slate-900/15">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">
                Besoin d&apos;aide ?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Notre équipe peut vous accompagner pour toute question sur votre commande.
              </p>
              <a
                href="/devis"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-100"
              >
                Demander de l&apos;aide
              </a>
            </section>
          </aside>
        </div>
      </div>
    </ClientShell>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words font-bold">{value}</p>
      </div>
    </div>
  );
}

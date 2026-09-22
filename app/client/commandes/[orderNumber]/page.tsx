"use client";

import { useEffect, useState } from "react";
import { ClientShell } from "@/components/client/client-shell";
import { getClientOrderByNumber, getClientOrderHistory } from "@/lib/data";
import { Order, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/types";

export default function OrderTrackingPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<
    { id: string; status: string; comment: string | null; created_at: string }[]
  >([]);
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
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Impossible de charger le suivi.",
        ),
      );
  }, [params.orderNumber]);
  if (error)
    return (
      <ClientShell>
        <p role="alert" className="text-destructive">
          {error}
        </p>
      </ClientShell>
    );
  if (!order)
    return (
      <ClientShell>
        <p>Chargement...</p>
      </ClientShell>
    );
  return (
    <ClientShell>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <p className="text-sm font-bold text-primary">{order.order_number}</p>
          <h1 className="mt-1 text-3xl font-black">Suivi de commande</h1>
          <span
            className={`mt-4 inline-block rounded-full border px-3 py-1 text-xs font-bold ${ORDER_STATUS_COLORS[order.status]}`}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
        <div className="space-y-4">
          {history.map((step) => (
            <div key={step.id} className="flex gap-4">
              <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-primary" />
              <div>
                <p className="font-bold">
                  {ORDER_STATUS_LABELS[
                    step.status as keyof typeof ORDER_STATUS_LABELS
                  ] || step.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(step.created_at).toLocaleString("fr-FR")}
                </p>
                {step.comment && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.comment}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="brand-surface space-y-2 rounded-2xl p-5 text-sm">
          <p>Transporteur : {order.carrier || "À confirmer"}</p>
          <p>Tracking : {order.tracking_number || "À confirmer"}</p>
          <p>Livraison estimée : {order.estimated_delivery || "À confirmer"}</p>
        </div>
      </div>
    </ClientShell>
  );
}

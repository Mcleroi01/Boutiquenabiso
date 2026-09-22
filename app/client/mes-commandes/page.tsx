"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientShell } from "@/components/client/client-shell";
import { getClientOrders } from "@/lib/data";
import { Order, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/types";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    getClientOrders()
      .then(setOrders)
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : "Impossible de charger les commandes.",
        ),
      );
  }, []);
  return (
    <ClientShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-black">Mes commandes</h1>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        {orders.length === 0 && (
          <p className="text-muted-foreground">
            Aucune commande pour le moment.
          </p>
        )}
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="brand-surface rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">
                    {order.order_number || order.id}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {order.product_name} × {order.quantity}
                  </p>
                  <p className="text-sm">
                    Total estimé : {order.total_estimated} {order.currency}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${ORDER_STATUS_COLORS[order.status]}`}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <Link
                href={`/client/commandes/${order.order_number || order.id}`}
                className="mt-4 inline-block text-sm font-bold text-primary"
              >
                Voir le suivi
              </Link>
            </article>
          ))}
        </div>
      </div>
    </ClientShell>
  );
}

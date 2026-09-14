"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  Loader2,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { getAdminProducts, getOrders } from "@/lib/data";
import {
  Order,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  OrderStatus,
  Product,
} from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminProducts(), getOrders()])
      .then(([p, o]) => {
        setProducts(p);
        setOrders(o);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Chargement...
      </div>
    );
  }

  const inStockCount = products.filter(
    (p) => p.stock_status === "in_stock",
  ).length;
  const orderCount = products.filter((p) => p.stock_status === "order").length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status),
  ).length;
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.price * o.quantity, 0);
  const localStock = products.filter(
    (product) => product.stock_status === "in_stock",
  );
  const potentialSales = localStock.reduce(
    (sum, product) => sum + product.selling_price * product.quantity,
    0,
  );
  const stockCost = localStock.reduce(
    (sum, product) => sum + product.purchase_price * product.quantity,
    0,
  );
  const potentialProfit = potentialSales - stockCost;
  const bestMargins = [...products]
    .sort(
      (a, b) =>
        (b.selling_price
          ? (b.selling_price - b.purchase_price) / b.selling_price
          : 0) -
        (a.selling_price
          ? (a.selling_price - a.purchase_price) / a.selling_price
          : 0),
    )
    .slice(0, 3);
  const recentOrders = orders.slice(0, 5);
  const statusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<OrderStatus, number>,
  );

  const stats = [
    {
      label: "Total produits",
      value: products.length,
      icon: Package,
      color: "text-sky-700 bg-sky-50 ring-sky-100",
    },
    {
      label: "En stock",
      value: inStockCount,
      icon: CheckCircle2,
      color: "text-emerald-700 bg-emerald-50 ring-emerald-100",
    },
    {
      label: "Sur commande",
      value: orderCount,
      icon: Clock,
      color: "text-amber-700 bg-amber-50 ring-amber-100",
    },
    {
      label: "Commandes",
      value: totalOrders,
      icon: ClipboardList,
      color: "text-indigo-700 bg-indigo-50 ring-indigo-100",
    },
    {
      label: "En cours",
      value: pendingOrders,
      icon: TrendingUp,
      color: "text-cyan-700 bg-cyan-50 ring-cyan-100",
    },
    {
      label: "Chiffre d'affaires",
      value: formatPrice(revenue),
      icon: DollarSign,
      color: "text-primary bg-teal-50 ring-teal-100",
    },
    {
      label: "Ventes potentielles du stock",
      value: formatPrice(potentialSales),
      icon: DollarSign,
      color: "text-indigo-700 bg-indigo-50 ring-indigo-100",
    },
    {
      label: "Coût d’achat du stock",
      value: formatPrice(stockCost),
      icon: Package,
      color: "text-orange-700 bg-orange-50 ring-orange-100",
    },
    {
      label: "Bénéfice potentiel",
      value: formatPrice(potentialProfit),
      icon: TrendingUp,
      color: "text-emerald-700 bg-emerald-50 ring-emerald-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Administration
        </p>
        <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble du catalogue et des commandes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
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

      <div className="brand-surface rounded-2xl p-5 md:p-6">
        <h2 className="text-base font-bold">Commandes par statut</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => (
            <div
              key={status}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold",
                ORDER_STATUS_COLORS[status],
              )}
            >
              <span>{statusCounts[status] || 0}</span>
              {ORDER_STATUS_LABELS[status]}
            </div>
          ))}
        </div>
      </div>

      <div className="brand-surface rounded-2xl p-5 md:p-6">
        <h2 className="text-base font-bold">Meilleures marges</h2>
        <div className="mt-4 space-y-3">
          {bestMargins.map((product) => {
            const margin =
              product.selling_price > 0
                ? ((product.selling_price - product.purchase_price) /
                    product.selling_price) *
                  100
                : 0;
            return (
              <div
                key={product.id}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <span className="truncate font-semibold">{product.name}</span>
                <span className="shrink-0 font-black text-emerald-700">
                  {margin.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="brand-surface overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/70 p-5">
          <h2 className="text-base font-bold">Commandes récentes</h2>
          <Link
            href="/admin/commandes"
            className="text-sm font-bold text-primary hover:underline"
          >
            Voir tout
          </Link>
        </div>
        {recentOrders.length > 0 ? (
          <div className="divide-y divide-border/70">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-bold">
                    {order.customer_name}
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
          </div>
        )}
      </div>
    </div>
  );
}

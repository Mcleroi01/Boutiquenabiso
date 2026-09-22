"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  X,
  Loader2,
  Search,
  MessageCircle,
} from "lucide-react";
import {
  getOrders,
  getProducts,
  createOrder,
  updateOrderStatus,
  updateOrderDetails,
  deleteOrder,
} from "@/lib/data";
import {
  Order,
  Product,
  OrderStatus,
  PaymentStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [notes, setNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [shippingCost, setShippingCost] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");

  const loadData = useCallback(async () => {
    const [o, p] = await Promise.all([getOrders(), getProducts()]);
    setOrders(o);
    setProducts(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModal = (order: Order | null) => {
    setEditing(order);
    setCustomerName(order?.customer_name || "");
    setCustomerPhone(order?.customer_phone || "");
    setProductId(order?.product_id || "");
    setQuantity(order?.quantity?.toString() || "1");
    setPrice(order?.price?.toString() || "");
    setStatus(order?.status || "pending");
    setNotes(order?.notes || "");
    setTrackingNumber(order?.tracking_number || "");
    setCarrier(order?.carrier || "");
    setEstimatedDelivery(order?.estimated_delivery || "");
    setShippingCost(order?.shipping_cost?.toString() || "0");
    setPaymentStatus(order?.payment_status || "unpaid");
    setError("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Nom et téléphone requis.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const product = products.find((p) => p.id === productId);
      const orderData = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        product_id: productId || null,
        product_name: product?.name || "Produit personnalisé",
        quantity: parseInt(quantity) || 1,
        price: parseFloat(price) || product?.price || 0,
        status,
        notes: notes.trim() || null,
      };
      if (editing) {
        await updateOrderDetails(editing.id, {
          status,
          admin_note: notes.trim() || null,
          tracking_number: trackingNumber.trim() || null,
          carrier: carrier.trim() || null,
          estimated_delivery: estimatedDelivery || null,
          shipping_cost: Number(shippingCost) || 0,
          payment_status: paymentStatus,
        });
      } else {
        await createOrder(orderData as never);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    await updateOrderStatus(id, newStatus);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette commande ?")) return;
    setDeletingId(id);
    try {
      await deleteOrder(id);
      await loadData();
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !o.customer_name.toLowerCase().includes(q) &&
        !o.product_name.toLowerCase().includes(q) &&
        !o.customer_phone.includes(q)
      )
        return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Commandes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {orders.length} commandes enregistrées.
          </p>
        </div>
        <button
          onClick={() => openModal(null)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Nouvelle commande
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom, produit, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-white pl-11 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as OrderStatus | "all")
          }
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Tous les statuts</option>
          {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">
                      {order.customer_name}
                    </p>
                    <a
                      href={`https://wa.me/${order.customer_phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#25D366] hover:underline"
                    >
                      <MessageCircle className="h-3 w-3" />
                      {order.customer_phone}
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.product_name} × {order.quantity}
                  </p>
                  {order.delivery_latitude != null &&
                    order.delivery_longitude != null && (
                      <div className="text-xs text-muted-foreground">
                        <p>
                          📍 Position de livraison :{" "}
                          {order.delivery_latitude.toFixed(5)},{" "}
                          {order.delivery_longitude.toFixed(5)}
                        </p>
                        {order.delivery_accuracy != null && (
                          <p>
                            Précision : {Math.round(order.delivery_accuracy)} m
                          </p>
                        )}
                        <a
                          className="font-bold text-primary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                          href={`https://www.google.com/maps?q=${order.delivery_latitude},${order.delivery_longitude}`}
                        >
                          Voir sur la carte
                        </a>
                      </div>
                    )}
                  {order.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      &quot;{order.notes}&quot;
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">
                    {formatPrice(order.price * order.quantity)}
                  </span>
                  <button
                    onClick={() => openModal(order)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    disabled={deletingId === order.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {deletingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={order.status}
                  onChange={(e) =>
                    handleStatusChange(order.id, e.target.value as OrderStatus)
                  }
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium outline-none cursor-pointer",
                    ORDER_STATUS_COLORS[order.status],
                  )}
                >
                  {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map(
                    (s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucune commande trouvée.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between p-5 border-b border-border bg-card z-10">
              <h2 className="text-lg font-bold">
                {editing ? "Modifier la commande" : "Nouvelle commande"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Patrick Mwamba"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">WhatsApp *</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="+243812345678"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Produit</label>
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    const p = products.find((p) => p.id === e.target.value);
                    if (p) setPrice(p.price.toString());
                  }}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Produit personnalisé</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatPrice(p.price)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Prix unitaire (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Statut</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map(
                    (s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Notes internes..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="space-y-2 text-sm font-semibold">
                  Transporteur
                  <input
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm font-normal"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold">
                  Numéro de tracking
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm font-normal"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold">
                  Livraison estimée
                  <input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm font-normal"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold">
                  Frais de transport
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm font-normal"
                  />
                </label>
              </div>
              <label className="block space-y-2 text-sm font-semibold">
                Statut du paiement
                <select
                  value={paymentStatus}
                  onChange={(e) =>
                    setPaymentStatus(e.target.value as PaymentStatus)
                  }
                  className="w-full rounded-xl border px-4 py-2.5 text-sm font-normal"
                >
                  {(
                    ["unpaid", "pending", "paid", "refunded"] as PaymentStatus[]
                  ).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

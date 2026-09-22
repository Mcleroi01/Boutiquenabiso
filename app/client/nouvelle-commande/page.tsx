"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ClientShell } from "@/components/client/client-shell";
import {
  createClientOrder,
  getClientProfile,
  updateClientLocation,
} from "@/lib/data";
import { requestLocation, type Location } from "@/lib/geolocation";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";

export default function NewOrderPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Kinshasa");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationBusy, setLocationBusy] = useState(false);
  const [variants, setVariants] = useState<Record<string, string>>({});
  useEffect(() => {
    getClientProfile().then((p) => {
      setPhone(p.phone || "");
      if (p.location_latitude != null && p.location_longitude != null)
        setLocation({
          latitude: p.location_latitude,
          longitude: p.location_longitude,
          accuracy: p.location_accuracy,
        });
    });
    const id = params.get("product");
    const requestedQuantity = params.get("quantity");
    if (requestedQuantity) setQuantity(requestedQuantity);
    const requestedVariants = params.get("variants");
    if (requestedVariants) {
      try {
        setVariants(JSON.parse(requestedVariants));
      } catch {
        setVariants({});
      }
    }
    if (id)
      supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then(({ data }) => setProduct(data));
  }, [params]);
  const shareLocation = async () => {
    setLocationBusy(true);
    setLocationMessage("");
    try {
      const next = await requestLocation();
      setLocation(next);
      await updateClientLocation(next);
      setLocationMessage("Position enregistrée pour cette commande.");
    } catch (caught) {
      setLocationMessage(
        caught instanceof Error ? caught.message : "Position non disponible.",
      );
    } finally {
      setLocationBusy(false);
    }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setBusy(true);
    setError("");
    try {
      const order = await createClientOrder({
        product_id: product.id,
        product_name: product.name,
        quantity: Number(quantity),
        price: Number(product.price),
        delivery_city: city,
        customer_phone: phone,
        customer_note: note,
        variant_selection: variants,
        delivery_latitude: location?.latitude,
        delivery_longitude: location?.longitude,
        delivery_accuracy: location?.accuracy,
      });
      router.push(`/client/commandes/${order.order_number}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de créer la commande.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <ClientShell>
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-3xl font-black">Passer une commande</h1>
        {product ? (
          <form
            onSubmit={submit}
            className="brand-surface space-y-4 rounded-2xl p-6"
          >
            <p className="font-bold">{product.name}</p>
            <p>
              {product.price} {product.currency}
            </p>
            <label className="block space-y-2 text-sm font-bold">
              Quantité
              <input
                required
                min="1"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="focus-ring w-full rounded-xl border px-4 py-3 font-normal"
              />
            </label>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-bold">
                📍 Pour faciliter la livraison, veuillez autoriser votre
                position.
              </p>
              <button
                type="button"
                onClick={shareLocation}
                disabled={locationBusy}
                className="mt-3 rounded-lg border border-primary px-3 py-2 font-bold text-primary"
              >
                {locationBusy
                  ? "Recherche..."
                  : location
                    ? "Position partagée"
                    : "Partager ma position"}
              </button>
              {locationMessage && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {locationMessage}
                </p>
              )}
            </div>
            <label className="block space-y-2 text-sm font-bold">
              WhatsApp
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="focus-ring w-full rounded-xl border px-4 py-3 font-normal"
              />
            </label>
            <label className="block space-y-2 text-sm font-bold">
              Ville de livraison
              <input
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="focus-ring w-full rounded-xl border px-4 py-3 font-normal"
              />
            </label>
            <label className="block space-y-2 text-sm font-bold">
              Note
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="focus-ring w-full rounded-xl border px-4 py-3 font-normal"
              />
            </label>
            {error && (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              {busy ? "Enregistrement..." : "Confirmer la commande"}
            </button>
          </form>
        ) : (
          <p className="text-muted-foreground">Produit introuvable.</p>
        )}
      </div>
    </ClientShell>
  );
}

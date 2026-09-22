"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ClientShell } from "@/components/client/client-shell";
import {
  getClientNotifications,
  getClientOrders,
  getClientProfile,
  updateClientLocation,
  updateClientProfile,
} from "@/lib/data";
import { Order } from "@/lib/types";
import { requestLocation, type Location } from "@/lib/geolocation";

export default function MyAccountPage() {
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    city: "",
    address: "",
    neighborhood: "",
    email: "",
    location_latitude: null as number | null,
    location_longitude: null as number | null,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; message: string }[]
  >([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationBusy, setLocationBusy] = useState(false);
  useEffect(() => {
    Promise.all([
      getClientProfile(),
      getClientOrders(),
      getClientNotifications(),
    ])
      .then(([p, o, n]) => {
        setProfile(p);
        setOrders(o);
        setNotifications(n);
      })
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Impossible de charger le compte.",
        ),
      );
  }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    try {
      await updateClientProfile(profile);
      setSaved(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Impossible de modifier le profil.",
      );
    }
  };
  const active = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status),
  ).length;
  const shareLocation = async () => {
    setLocationBusy(true);
    setLocationMessage("");
    try {
      const location: Location = await requestLocation();
      await updateClientLocation(location);
      setLocationMessage("Position mise à jour.");
    } catch (caught) {
      setLocationMessage(
        caught instanceof Error ? caught.message : "Position non disponible.",
      );
    } finally {
      setLocationBusy(false);
    }
  };
  return (
    <ClientShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black">Mon compte</h1>
          <p className="text-muted-foreground">
            Gérez vos informations et suivez vos commandes.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="brand-surface rounded-2xl p-4">
            <b>{orders.length}</b>
            <p className="text-sm text-muted-foreground">Commandes</p>
          </div>
          <div className="brand-surface rounded-2xl p-4">
            <b>{active}</b>
            <p className="text-sm text-muted-foreground">En cours</p>
          </div>
          <div className="brand-surface rounded-2xl p-4">
            <b>{notifications.length}</b>
            <p className="text-sm text-muted-foreground">Notifications</p>
          </div>
        </div>
        <form
          onSubmit={submit}
          className="brand-surface max-w-xl space-y-4 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold">Mes informations</h2>
          {[
            ["full_name", "Nom complet"],
            ["phone", "WhatsApp"],
            ["city", "Ville"],
            ["address", "Adresse"],
            ["neighborhood", "Quartier"],
          ].map(([key, label]) => (
            <label key={key} className="block space-y-2 text-sm font-bold">
              {label}
              <input
                value={profile[key as keyof typeof profile] ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, [key]: e.target.value })
                }
                className="focus-ring w-full rounded-xl border border-border bg-white px-4 py-3 font-normal"
              />
            </label>
          ))}
          <p className="text-sm text-muted-foreground">
            Email : {profile.email}
          </p>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-bold">📍 Dernière position connue</p>
            {profile.location_latitude != null &&
              profile.location_longitude != null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {profile.location_latitude}, {profile.location_longitude}
                </p>
              )}
            <button
              type="button"
              onClick={shareLocation}
              disabled={locationBusy}
              className="mt-3 rounded-lg border border-primary px-3 py-2 font-bold text-primary"
            >
              {locationBusy ? "Recherche..." : "Mettre à jour ma position"}
            </button>
            {locationMessage && (
              <p className="mt-2 text-xs text-muted-foreground">
                {locationMessage}
              </p>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {saved && (
            <p className="text-sm text-emerald-700">Profil enregistré.</p>
          )}
          <button className="rounded-xl bg-primary px-4 py-3 font-bold text-white">
            Enregistrer
          </button>
        </form>
        <nav className="flex flex-wrap gap-3">
          <Link
            className="rounded-xl border px-4 py-3 font-bold"
            href="/client/mes-commandes"
          >
            Mes commandes
          </Link>
          <Link
            className="rounded-xl border px-4 py-3 font-bold"
            href="/client/mes-demandes"
          >
            Mes demandes
          </Link>
        </nav>
      </div>
    </ClientShell>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LocateFixed, Mail, Phone, UserRound } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { signUpClient } from "@/lib/auth";
import { requestLocation, type Location } from "@/lib/geolocation";
import { updateClientLocation } from "@/lib/data";

export default function ClientRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationBusy, setLocationBusy] = useState(false);

  const allowLocation = async () => {
    setLocationBusy(true);
    setLocationMessage("");
    try {
      const nextLocation = await requestLocation();
      setLocation(nextLocation);
      setLocationMessage("Position autorisée.");
    } catch (caught) {
      setLocationMessage(
        caught instanceof Error ? caught.message : "Position non disponible.",
      );
    } finally {
      setLocationBusy(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await signUpClient(form);
      if (result.session && location) await updateClientLocation(location);
      if (result.session) {
        router.push(searchParams.get("next") || "/client/mon-compte");
      } else {
        setMessage("Vérifiez votre email pour confirmer votre compte.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Inscription impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex-1 py-10 md:py-14">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Espace client
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
                Créer mon compte
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                Un compte suffit pour passer vos commandes et suivre les confirmations de la boutique.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="brand-surface space-y-5 rounded-2xl p-6 md:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-bold">
                Nom complet
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                  className="focus-ring w-full rounded-xl border border-border bg-white px-4 py-3 font-normal"
                  autoComplete="name"
                />
              </label>
              <label className="block space-y-2 text-sm font-bold">
                Numéro WhatsApp
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    className="focus-ring w-full rounded-xl border border-border bg-white py-3 pl-11 pr-4 font-normal"
                    autoComplete="tel"
                  />
                </div>
              </label>
            </div>

            <label className="block space-y-2 text-sm font-bold">
              Email
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="focus-ring w-full rounded-xl border border-border bg-white py-3 pl-11 pr-4 font-normal"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block space-y-2 text-sm font-bold">
              Mot de passe
              <input
                required
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="focus-ring w-full rounded-xl border border-border bg-white px-4 py-3 font-normal"
                autoComplete="new-password"
              />
            </label>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <div className="flex items-start gap-3">
                <LocateFixed className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-bold">Position de livraison optionnelle</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Elle aide l'équipe à confirmer la livraison sur WhatsApp. Vous pouvez aussi l'ajouter plus tard.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={allowLocation}
                disabled={locationBusy}
                className="mt-3 rounded-xl border border-primary px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
              >
                {locationBusy ? "Recherche..." : "Autoriser ma position"}
              </button>
              {locationMessage && (
                <p className="mt-2 text-xs text-muted-foreground">{locationMessage}</p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            {message && (
              <p
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                {message}
              </p>
            )}

            <button
              disabled={busy}
              className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-teal-900/10 transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? "Création..." : "Créer mon compte"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Déjà inscrit ?{" "}
              <Link className="font-bold text-primary" href="/login">
                Se connecter
              </Link>
            </p>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

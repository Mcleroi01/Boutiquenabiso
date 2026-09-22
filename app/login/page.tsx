"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShoppingBag } from "lucide-react";
import { safeNextForRole, useAuth } from "@/lib/auth";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, loading, user, role, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && role) {
      router.replace(safeNextForRole(searchParams.get("next"), role));
    }
  }, [loading, role, router, searchParams, user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    try {
      const result = await signIn(email.trim(), password);
      if (result.error) throw new Error(result.error);
      router.replace(safeNextForRole(searchParams.get("next"), result.role));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex flex-1 items-center justify-center py-10 md:py-16">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Espace sécurisé
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
                Bienvenue chez Boutique Na Biso
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                Connectez-vous pour gérer vos commandes et accéder à votre espace personnel.
              </p>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="brand-surface space-y-5 rounded-2xl p-6 shadow-md md:p-8"
          >
            <div>
              <h2 className="text-xl font-black">Se connecter</h2>
            </div>

            <label className="block space-y-2 text-sm font-bold">
              Email
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="focus-ring w-full rounded-xl border border-border bg-white py-3 pl-11 pr-4 font-normal"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block space-y-2 text-sm font-bold">
              Mot de passe
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="focus-ring w-full rounded-xl border border-border bg-white py-3 pl-11 pr-4 font-normal"
                  autoComplete="current-password"
                />
              </div>
            </label>

            {(error || authError) && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error || authError}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || loading}
              className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-teal-900/10 transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {busy || loading ? "Connexion..." : "Se connecter"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Nouveau client ?{" "}
              <Link className="font-bold text-primary" href="/client/inscription">
                Créer un compte
              </Link>
            </p>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

import Link from "next/link";
import { CheckCircle2, LogIn, ShoppingBag } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function RegistrationSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex flex-1 items-center justify-center py-12 md:py-20">
        <section className="brand-surface w-full max-w-xl rounded-2xl p-6 text-center md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-6 text-2xl font-black tracking-tight md:text-3xl">
            Compte créé avec succès !
          </h1>
          <p className="mt-3 text-base font-bold text-foreground">
            Bienvenue chez Boutique Na Biso.
          </p>
          <div className="mx-auto mt-5 max-w-md space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Nous avons envoyé un e-mail de confirmation à votre adresse.</p>
            <p>
              Veuillez vérifier votre boîte de réception et cliquer sur le lien
              de confirmation pour activer votre compte.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ShoppingBag className="h-4 w-4" />
              Retour à la boutique
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 font-bold text-primary transition-colors hover:bg-primary/5"
            >
              <LogIn className="h-4 w-4" />
              Se connecter
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

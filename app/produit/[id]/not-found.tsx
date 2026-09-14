import Link from 'next/link';
import { Package } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export default function ProductNotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h1 className="text-xl font-bold mb-2">Produit introuvable</h1>
        <p className="text-sm text-muted-foreground mb-6">Ce produit n'existe plus ou a été supprimé.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Retour au catalogue
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

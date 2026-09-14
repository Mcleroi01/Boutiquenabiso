'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Headphones,
  Laptop,
  Package,
  PackageCheck,
  Search,
  Shirt,
  Smartphone,
  Sparkles,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { Category, ProductWithCategory } from '@/lib/types';
import { ProductCard } from './product-card';
import { PlatformsSection } from './platform-mark';
import { cn } from '@/lib/utils';

const iconMap: Record<string, typeof Smartphone> = {
  Smartphone,
  Headphones,
  Laptop,
  Shirt,
  Package,
};

export function CatalogClient({
  products,
  categories,
  whatsappNumber,
  storeName,
  storeDescription,
}: {
  products: ProductWithCategory[];
  categories: Category[];
  whatsappNumber: string;
  storeName: string;
  storeDescription: string;
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'order'>('all');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && p.category_id !== selectedCategory) return false;
      if (stockFilter !== 'all' && p.stock_status !== stockFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategory, stockFilter, search]);

  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);
  const cleanWhatsapp = whatsappNumber.replace(/[^0-9]/g, '');

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/50 bg-[linear-gradient(135deg,#fffaf0_0%,#ffffff_44%,#eaf7f2_100%)]">
        <div className="absolute inset-0 soft-grid opacity-70" />
        <div className="container-page relative grid gap-10 py-12 md:grid-cols-[1.05fr_0.95fr] md:py-16 lg:py-20">
          <div className="flex flex-col justify-center space-y-6 animate-slide-up">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-3 py-1.5 text-xs font-bold text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Achat en Chine - Livraison à Kinshasa
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                {storeName}
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {storeDescription ||
                  'Votre intermédiaire de confiance pour commander en Chine. Vous choisissez, nous vérifions, nous achetons et nous livrons à Kinshasa.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={cleanWhatsapp ? `https://wa.me/${cleanWhatsapp}` : '#catalogue'}
                target={cleanWhatsapp ? '_blank' : undefined}
                rel={cleanWhatsapp ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-teal-900/10 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl"
              >
                Nous contacter sur WhatsApp
              </a>
              <a
                href="#catalogue"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:bg-muted"
              >
                Voir le catalogue
              </a>
            </div>
            <div className="grid max-w-xl grid-cols-3 gap-3 pt-2">
              {[
                { label: 'Produits vérifiés', icon: CheckCircle2 },
                { label: 'Prix clairs', icon: PackageCheck },
                { label: 'Kinshasa', icon: Truck },
              ].map((item) => (
                <div key={item.label} className="brand-surface rounded-2xl p-3">
                  <item.icon className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-xs font-bold leading-snug">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-slide-up md:pt-6" style={{ animationDelay: '90ms' }}>
            <div className="brand-surface overflow-hidden rounded-[1.5rem]">
              <div className="border-b border-border/60 bg-slate-950 px-5 py-4 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Sélection boutique</p>
                <p className="mt-1 text-lg font-bold">Import Chine - RDC</p>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                {(featuredProducts.length ? featuredProducts : products.slice(0, 4)).map((product) => (
                  <div key={product.id} className="overflow-hidden rounded-2xl border border-border/70 bg-white">
                    <div className="aspect-square bg-muted/40">
                      {product.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-7 w-7 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-xs font-bold">{product.name}</p>
                      <p className="mt-1 text-sm font-black text-primary">
                        ${Number(product.price).toLocaleString('en-US')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PlatformsSection />

      {featuredProducts.length > 0 && (
        <section className="container-page py-8 md:py-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Produits en vedette</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} whatsappNumber={whatsappNumber} />
            ))}
          </div>
        </section>
      )}

      <section id="catalogue" className="container-page scroll-mt-20 py-10">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Catalogue complet</h2>
          </div>
          <span className="text-sm font-medium text-muted-foreground">{filtered.length} produits affichés</span>
        </div>

        <div className="brand-surface mb-6 rounded-2xl p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="focus-ring w-full rounded-xl border border-border bg-white pl-11 pr-4 py-3 text-sm"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {[
                { value: 'all', label: 'Tous' },
                { value: 'in_stock', label: 'En stock' },
                { value: 'order', label: 'Sur commande' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStockFilter(opt.value as typeof stockFilter)}
                  className={cn(
                    'whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-bold transition-all',
                    stockFilter === opt.value
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-white text-muted-foreground hover:bg-muted'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all',
                selectedCategory === null
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-white text-muted-foreground ring-1 ring-border hover:bg-muted'
              )}
            >
              Toutes les catégories
            </button>
            {categories.map((cat) => {
              const Icon = (cat.icon && iconMap[cat.icon]) || Package;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-white text-muted-foreground ring-1 ring-border hover:bg-muted'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} whatsappNumber={whatsappNumber} />
            ))}
          </div>
        ) : (
          <div className="brand-surface flex flex-col items-center justify-center rounded-2xl py-20 text-center">
            <Package className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="font-semibold text-muted-foreground">Aucun produit trouvé.</p>
          </div>
        )}
      </section>
    </>
  );
}

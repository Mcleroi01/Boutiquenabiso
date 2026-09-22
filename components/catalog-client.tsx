"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import { Category, ProductWithCategory } from "@/lib/types";
import { ProductCard } from "./product-card";
import { PlatformsSection } from "./platform-mark";
import { cn } from "@/lib/utils";

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
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "order">(
    "all",
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && p.category_id !== selectedCategory) return false;
      if (stockFilter !== "all" && p.stock_status !== stockFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.description?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategory, stockFilter, search]);

  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);
  const cleanWhatsapp = whatsappNumber.replace(/[^0-9]/g, "");

  return (
    <>
      <section className="relative overflow-hidden bg-[#f3f4ee]">
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-white/70" />
        <div className="container-page relative grid gap-10 py-14 md:grid-cols-[0.95fr_1.05fr] md:py-20 lg:gap-16 lg:py-24">
          <div className="relative z-10 flex flex-col justify-center space-y-7 animate-slide-up">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-8 bg-primary" />
              Chine → Kinshasa
            </div>
            <div className="space-y-5">
              <h1 className="max-w-2xl text-5xl font-black leading-[0.96] tracking-[-0.04em] md:text-7xl">
                {storeName}
                <span className="mt-2 block text-primary"> simplement.</span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
                {storeDescription ||
                  "Découvrez des produits sélectionnés en Chine, vérifiés par notre équipe et livrés à Kinshasa."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={
                  cleanWhatsapp
                    ? `https://wa.me/${cleanWhatsapp}`
                    : "#catalogue"
                }
                target={cleanWhatsapp ? "_blank" : undefined}
                rel={cleanWhatsapp ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl"
              >
                Découvrir la sélection
              </a>
              <a
                href="#catalogue"
                className="inline-flex items-center gap-2 text-sm font-bold text-foreground transition-colors hover:text-primary"
              >
                Voir le catalogue <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="grid max-w-xl grid-cols-3 gap-5 border-t border-slate-300/70 pt-5">
              {[
                { label: "Produits vérifiés", icon: CheckCircle2 },
                { label: "Prix transparents", icon: PackageCheck },
                { label: "Livraison Kinshasa", icon: Truck },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <item.icon className="h-4 w-4 text-primary" />
                  <p className="text-[11px] font-bold leading-snug text-slate-600">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative animate-slide-up md:pt-4"
            style={{ animationDelay: "90ms" }}
          >
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-3 shadow-2xl shadow-slate-900/20 sm:p-5">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
              <div className="relative mb-4 flex items-end justify-between px-1 text-white">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
                    Sélection boutique
                  </p>
                  <p className="mt-1 text-xl font-black">
                    Les favoris du moment
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-amber-200" />
              </div>
              <div className="relative grid grid-cols-2 gap-3">
                {(featuredProducts.length
                  ? featuredProducts
                  : products.slice(0, 4)
                ).map((product) => (
                  <a
                    href={`/produit/${product.slug || product.id}`}
                    key={product.id}
                    className="group overflow-hidden rounded-2xl bg-white"
                  >
                    <div className="aspect-[1.05] overflow-hidden bg-muted/40">
                      {product.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-7 w-7 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-xs font-bold text-slate-900">
                        {product.name}
                      </p>
                      <p className="mt-1 text-sm font-black text-primary">
                        ${Number(product.price).toLocaleString("en-US")}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PlatformsSection />

      {featuredProducts.length > 0 && (
        <section className="container-page py-12 md:py-16">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                À découvrir
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Produits en vedette
              </h2>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                whatsappNumber={whatsappNumber}
              />
            ))}
          </div>
        </section>
      )}

      <section
        id="catalogue"
        className="container-page scroll-mt-24 py-12 md:py-16"
      >
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Explorer
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">
              Catalogue complet
            </h2>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {filtered.length} produits affichés
          </span>
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
                { value: "all", label: "Tous" },
                { value: "in_stock", label: "En stock" },
                { value: "order", label: "Sur commande" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setStockFilter(opt.value as typeof stockFilter)
                  }
                  className={cn(
                    "whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-bold transition-all",
                    stockFilter === opt.value
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-white text-muted-foreground hover:bg-muted",
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
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all",
                selectedCategory === null
                  ? "bg-accent text-accent-foreground"
                  : "bg-white text-muted-foreground ring-1 ring-border hover:bg-muted",
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
                    "inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "bg-white text-muted-foreground ring-1 ring-border hover:bg-muted",
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
              <ProductCard
                key={product.id}
                product={product}
                whatsappNumber={whatsappNumber}
              />
            ))}
          </div>
        ) : (
          <div className="brand-surface flex flex-col items-center justify-center rounded-2xl py-20 text-center">
            <Package className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="font-semibold text-muted-foreground">
              Aucun produit trouvé.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

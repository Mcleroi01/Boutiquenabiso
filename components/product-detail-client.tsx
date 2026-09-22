"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Shield,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { ProductWithCategory, VariantGroup } from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize-html";

export function ProductDetailClient({
  product,
}: {
  product: ProductWithCategory;
  whatsappNumber: string;
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [variantSelections, setVariantSelections] = useState<Record<string, string>>({});

  const inStock = product.stock_status === "in_stock";
  const images = product.images?.length ? product.images : [];
  const variants: VariantGroup[] = product.variants || [];
  const allVariantsSelected = variants.every((variant) => variantSelections[variant.name]);

  const orderQuery = new URLSearchParams({
    product: product.id,
    quantity: String(quantity),
  });
  if (allVariantsSelected) {
    orderQuery.set("variants", JSON.stringify(variantSelections));
  }

  return (
    <div className="container-page min-w-0 py-6 md:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-sm font-bold text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au catalogue
      </Link>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-12">
        <div className="min-w-0 space-y-4">
          <div className="brand-surface aspect-square overflow-hidden rounded-2xl">
            {images[selectedImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[selectedImage]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground/50">
                <Package className="h-10 w-10" />
                <span className="text-sm font-medium">Aucune image</span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex flex-wrap gap-3 pb-1">
              {images.map((img, index) => (
                <button
                  key={img}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition-all",
                    selectedImage === index
                      ? "border-primary shadow-md"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <div className="space-y-3">
            {product.category && (
              <span className="text-sm font-bold text-primary">{product.category.name}</span>
            )}
            <h1 className="break-words text-3xl font-black leading-tight tracking-tight md:text-4xl">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1",
                  inStock
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-amber-50 text-amber-800 ring-amber-200",
                )}
              >
                {inStock ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                {inStock ? "En stock à Kinshasa" : "Sur commande"}
              </span>
              {inStock && product.quantity > 0 && (
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                  {product.quantity} unités disponibles
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-lg shadow-slate-900/10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
              Prix boutique
            </p>
            <div className="mt-2 text-4xl font-black tracking-tight">{formatPrice(product.price)}</div>
          </div>

          {product.description && (
            <div
              className="product-description min-w-0 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere] [&_img]:h-auto [&_img]:max-w-full [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
            />
          )}

          {variants.length > 0 && (
            <div className="brand-surface space-y-4 rounded-2xl p-5">
              <div>
                <h2 className="text-base font-bold">Variantes disponibles</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choisissez les options nécessaires avant de commander.
                </p>
              </div>
              {variants.map((variant) => (
                <div key={variant.name} className="space-y-2">
                  <label className="block break-words text-sm font-bold">
                    {variant.name}
                    {!variantSelections[variant.name] && (
                      <span className="ml-2 text-xs font-medium text-muted-foreground sm:whitespace-nowrap">
                        Choisissez une option
                      </span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => {
                      const selected = variantSelections[variant.name] === option;
                      return (
                        <button
                          key={option}
                          onClick={() =>
                            setVariantSelections((current) => ({
                              ...current,
                              [variant.name]: option,
                            }))
                          }
                          className={cn(
                            "rounded-xl border px-4 py-2 text-sm font-bold transition-all",
                            selected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-white hover:border-primary/40 hover:bg-muted",
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold">Quantité</label>
            <div className="inline-flex items-center rounded-2xl border border-border bg-white shadow-sm">
              <button
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                className="flex h-12 w-12 items-center justify-center rounded-l-2xl hover:bg-muted"
                aria-label="Diminuer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-14 text-center text-sm font-black">{quantity}</span>
              <button
                onClick={() => setQuantity((current) => current + 1)}
                className="flex h-12 w-12 items-center justify-center rounded-r-2xl hover:bg-muted"
                aria-label="Augmenter"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {allVariantsSelected ? (
              <Link
                href={`/client/nouvelle-commande?${orderQuery.toString()}`}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-primary px-6 py-4 text-base font-black text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
              >
                <ShoppingBag className="h-5 w-5" />
                Commander
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-2xl bg-primary px-6 py-4 text-base font-black text-primary-foreground opacity-50"
              >
                <ShoppingBag className="h-5 w-5" />
                Commander
              </button>
            )}
            {!allVariantsSelected && variants.length > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Sélectionnez toutes les variantes pour commander.
              </p>
            )}
            <Link
              href="/devis"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl border border-primary px-6 py-4 text-base font-black text-primary transition-colors hover:bg-primary/5"
            >
              <FileText className="h-5 w-5" />
              Demander un devis
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-border/60 pt-4 sm:grid-cols-3">
            {[
              { label: "Produits vérifiés", icon: Shield },
              { label: "Livraison Kinshasa", icon: Truck },
              { label: "Confirmation WhatsApp", icon: MessageCircle },
            ].map((item) => (
              <div
                key={item.label}
                className="brand-surface flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

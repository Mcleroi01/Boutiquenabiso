"use client";

import Link from "next/link";
import { CheckCircle2, Clock, Package, ShoppingBag, Tag } from "lucide-react";
import { ProductWithCategory } from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize-html";

export function ProductCard({
  product,
  whatsappNumber,
}: {
  product: ProductWithCategory;
  whatsappNumber?: string;
}) {
  const inStock = product.stock_status === "in_stock";
  const image = product.images?.[0] || "";
  const variants =
    product.variants?.filter(
      (variant) => variant.name && variant.options?.length,
    ) || [];
  const featuredVariants = variants.slice(0, 2);
  const orderHref = `/client/nouvelle-commande?product=${encodeURIComponent(product.id)}&quantity=1`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-slate-900/10">
      <Link href={`/produit/${product.slug || product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted/30">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}

          <div className="absolute left-3 top-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-sm",
                inStock
                  ? "bg-emerald-50/95 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-amber-50/95 text-amber-800 ring-1 ring-amber-200",
              )}
            >
              {inStock ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  En stock
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  Sur commande
                </>
              )}
            </span>
          </div>

          {inStock && product.quantity > 0 && (
            <div className="absolute right-3 top-3">
              <span className="rounded-full bg-slate-950/75 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm">
                {product.quantity} dispo
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          {product.category && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              <Tag className="h-3 w-3" />
              {product.category.name}
            </span>
          )}
          <h3 className="min-h-[2.5rem] text-sm font-bold leading-snug line-clamp-2 transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          {product.description && (
            <div
              className="min-h-[2.5rem] line-clamp-2 text-xs leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(product.description),
              }}
            />
          )}
          {featuredVariants.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {featuredVariants.map((variant) => (
                <span
                  key={variant.name}
                  className="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold text-secondary-foreground"
                >
                  {variant.name}: {variant.options.slice(0, 2).join(" / ")}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-end justify-between gap-3 pt-1">
            <span className="text-xl font-black tracking-tight text-foreground">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs font-bold text-primary group-hover:underline">
              Détails
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-auto border-t border-border/60 p-3">
        <Link
          href={orderHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90"
        >
          <ShoppingBag className="h-4 w-4" />
          Commander
        </Link>
      </div>
    </article>
  );
}

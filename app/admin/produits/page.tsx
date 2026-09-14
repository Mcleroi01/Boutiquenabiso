"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ProductFormModal } from "@/components/admin/product-form-modal";
import {
  createProduct,
  deleteProduct,
  deleteProductStorageImages,
  getCategories,
  getAdminProducts,
  syncProductImages,
  updateProduct,
  uploadPublicImage,
} from "@/lib/data";
import { Category, ProductWithCategory } from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductWithCategory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [p, c] = await Promise.all([getAdminProducts(), getCategories()]);
    setProducts(p);
    setCategories(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (
    data: Omit<
      ProductWithCategory,
      "id" | "created_at" | "updated_at" | "category"
    >,
    imageFiles: File[],
  ) => {
    console.info('[product] début submit parent', { editing: Boolean(editingProduct), imageCount: imageFiles.length });
    try {
      console.info('[product] données produit préparées', data);
      let savedProduct: ProductWithCategory | null = null;
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        savedProduct = { ...editingProduct, ...data };
      } else {
        savedProduct = await createProduct(data);
      }
      if (!savedProduct) throw new Error('Supabase n’a pas retourné le produit créé.');

      const productId = savedProduct.id;
      const uploadedImages = await Promise.all(imageFiles.map(async (file) => {
        console.info('[product] début upload image', { name: file.name, size: file.size });
        const path = `${productId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const url = await uploadPublicImage('product-images', file, path);
        console.info('[product] upload image terminé', { name: file.name, path });
        return url;
      }));
      const images = [...data.images, ...uploadedImages];
      if (editingProduct) await deleteProductStorageImages(editingProduct.images.filter((image) => !images.includes(image)));
      if (uploadedImages.length || editingProduct) await updateProduct(productId, { images });
      if (images.length || editingProduct) {
        console.info('[product] synchronisation product_images démarrée');
        await syncProductImages(productId, images);
      } else {
        console.info('[product] aucune image à synchroniser');
      }
      console.info('[product] produit créé avec succès', { id: productId });
      setModalOpen(false);
      setEditingProduct(null);
      void loadData().catch((reloadError) => {
        console.error('[product] produit créé mais rechargement de la liste échoué', reloadError);
      });
    } catch (saveError) {
      console.error('[product] erreur complète création produit', saveError);
      throw saveError instanceof Error ? saveError : new Error('Erreur inconnue lors de la création du produit.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    setDeletingId(id);
    try {
      await deleteProduct(id);
      await loadData();
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Catalogue
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Produits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} produits dans le catalogue.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-teal-900/10 transition-all hover:-translate-y-0.5 hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </button>
      </div>

      <div className="brand-surface rounded-2xl p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus-ring w-full rounded-xl border border-border bg-white pl-11 pr-4 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="brand-surface overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-border/70 bg-muted/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-muted-foreground">
                  Produit
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-muted-foreground md:table-cell">
                  Catégorie
                </th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-muted-foreground">
                  Achat / vente
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-muted-foreground sm:table-cell">
                  Stock
                </th>
                <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {filtered.length > 0 ? (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/50">
                          {product.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate text-sm font-bold">
                            {product.name}
                          </p>
                          {product.featured && (
                            <span className="text-xs font-bold text-primary">
                              En vedette
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {product.category?.name || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold leading-5">
                        <div>
                          Achat :{" "}
                          {formatPrice(
                            product.purchase_price,
                            product.currency,
                          )}
                        </div>
                        <div className="text-primary">
                          Vente :{" "}
                          {formatPrice(product.selling_price, product.currency)}
                        </div>
                        <div className="text-emerald-700">
                          Bénéfice :{" "}
                          {formatPrice(
                            product.selling_price - product.purchase_price,
                            product.currency,
                          )}{" "}
                          (
                          {product.selling_price > 0
                            ? (
                                ((product.selling_price -
                                  product.purchase_price) /
                                  product.selling_price) *
                                100
                              ).toFixed(1)
                            : "0.0"}
                          %)
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold",
                          product.stock_status === "in_stock"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-800",
                        )}
                      >
                        {product.stock_status === "in_stock"
                          ? `En stock (${product.quantity})`
                          : "Sur commande"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setModalOpen(true);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted"
                          aria-label="Modifier"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-destructive/10 disabled:opacity-50"
                          aria-label="Supprimer"
                        >
                          {deletingId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Package className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      Aucun produit trouvé.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

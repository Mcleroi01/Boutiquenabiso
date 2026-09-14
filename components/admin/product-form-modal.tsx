"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2, Loader2, Star } from "lucide-react";
import {
  ProductWithCategory,
  Category,
  StockStatus,
  VariantGroup,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "./rich-text-editor";

interface FormData {
  name: string;
  description: string;
  purchase_price: string;
  selling_price: string;
  currency: string;
  category_id: string;
  stock_status: StockStatus;
  quantity: string;
  variants: VariantGroup[];
  images: string[];
  featured: boolean;
}

export function ProductFormModal({
  product,
  categories,
  onSave,
  onClose,
}: {
  product: ProductWithCategory | null;
  categories: Category[];
  onSave: (
    data: Omit<
      ProductWithCategory,
      "id" | "created_at" | "updated_at" | "category"
    >,
    imageFiles: File[],
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>({
    name: product?.name || "",
    description: product?.description || "",
    purchase_price: product?.purchase_price?.toString() || "0",
    selling_price:
      product?.selling_price?.toString() || product?.price?.toString() || "",
    currency: product?.currency || "USD",
    category_id: product?.category_id || categories[0]?.id || "",
    stock_status: product?.stock_status || "order",
    quantity: product?.quantity?.toString() || "0",
    variants: product?.variants || [],
    images: product?.images || [],
    featured: product?.featured || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const imagePreviewsRef = useRef<string[]>([]);

  useEffect(
    () => () =>
      imagePreviewsRef.current.forEach((preview) =>
        URL.revokeObjectURL(preview),
      ),
    [],
  );

  const update = (
    field: keyof FormData,
    value: string | boolean | VariantGroup[] | string[],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);
    const invalid = selected.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024,
    );
    if (invalid) {
      setError(
        "Chaque image doit être JPG, PNG ou WebP et ne pas dépasser 5 Mo.",
      );
      return;
    }
    setError("");
    setImageFiles((current) => [...current, ...selected]);
    const previews = selected.map((file) => URL.createObjectURL(file));
    imagePreviewsRef.current = [...imagePreviewsRef.current, ...previews];
    setImagePreviews((current) => [...current, ...previews]);
  };

  const removeSelectedImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    imagePreviewsRef.current = imagePreviewsRef.current.filter(
      (_, previewIndex) => previewIndex !== index,
    );
    setImageFiles((current) =>
      current.filter((_, fileIndex) => fileIndex !== index),
    );
    setImagePreviews((current) =>
      current.filter((_, previewIndex) => previewIndex !== index),
    );
  };

  const moveExistingImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= form.images.length) return;
    const images = [...form.images];
    [images[index], images[target]] = [images[target], images[index]];
    update("images", images);
  };

  const moveSelectedImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= imageFiles.length) return;
    const files = [...imageFiles];
    const previews = [...imagePreviews];
    [files[index], files[target]] = [files[target], files[index]];
    [previews[index], previews[target]] = [previews[target], previews[index]];
    setImageFiles(files);
    setImagePreviews(previews);
  };

  const addVariant = () => {
    update("variants", [...form.variants, { name: "", options: [""] }]);
  };

  const updateVariant = (
    index: number,
    field: keyof VariantGroup,
    value: string,
  ) => {
    const variants = [...form.variants];
    if (field === "name") {
      variants[index].name = value;
    } else if (field === "options") {
      // handled by separate functions
    }
    update("variants", variants);
  };

  const updateVariantOption = (
    vIndex: number,
    oIndex: number,
    value: string,
  ) => {
    const variants = [...form.variants];
    variants[vIndex].options[oIndex] = value;
    update("variants", variants);
  };

  const addVariantOption = (vIndex: number) => {
    const variants = [...form.variants];
    variants[vIndex].options.push("");
    update("variants", variants);
  };

  const removeVariantOption = (vIndex: number, oIndex: number) => {
    const variants = [...form.variants];
    variants[vIndex].options = variants[vIndex].options.filter(
      (_, i) => i !== oIndex,
    );
    update("variants", variants);
  };

  const removeVariant = (vIndex: number) => {
    update(
      "variants",
      form.variants.filter((_, i) => i !== vIndex),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.info("[product] début submit modal");
    setError("");
    if (!form.name.trim()) {
      console.warn("[product] validation échouée: nom manquant");
      setError("Le nom est requis.");
      return;
    }
    const purchasePrice = Number(form.purchase_price);
    const sellingPrice = Number(form.selling_price);
    const quantity = Number(form.quantity);
    if (
      !Number.isFinite(purchasePrice) ||
      purchasePrice < 0 ||
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0
    ) {
      console.warn("[product] validation échouée: prix invalides", {
        purchasePrice,
        sellingPrice,
      });
      setError(
        "Les prix d’achat et de vente doivent être des nombres positifs.",
      );
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      console.warn("[product] validation échouée: quantité invalide", quantity);
      setError("La quantité doit être un nombre entier positif ou nul.");
      return;
    }
    const imageCount = form.images.length + imageFiles.length;
    const requiresMinimumImages = !product || product.images.length >= 5;
    if (requiresMinimumImages && imageCount < 5) {
      console.warn("[product] validation échouée: moins de 5 images", imageCount);
      setError("Veuillez ajouter au moins 5 images.");
      return;
    }

    console.info("[product] validation terminée");
    setSaving(true);
    try {
      console.info("[product] données du produit préparées");
      await onSave(
        {
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: sellingPrice,
          purchase_price: purchasePrice,
          selling_price: sellingPrice,
          currency: form.currency,
          category_id: form.category_id || null,
          stock_status: form.stock_status,
          quantity,
          variants: form.variants.filter(
            (v) => v.name.trim() && v.options.some((o) => o.trim()),
          ),
          images: form.images.filter((img) => img.trim()),
          featured: form.featured,
        },
        imageFiles,
      );
    } catch (err) {
      console.error("[product] erreur affichée dans le modal", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-border bg-card z-10">
          <h2 className="text-lg font-bold">
            {product ? "Modifier le produit" : "Nouveau produit"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Nom du produit *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="iPhone 15 Pro Max 256GB"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Description</label>
            <RichTextEditor value={form.description} onChange={(value) => update("description", value)} />
          </div>

          {/* Prices + Category */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Prix d’achat (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.purchase_price}
                onChange={(e) => update("purchase_price", e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Prix de vente (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.selling_price}
                onChange={(e) => update("selling_price", e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="15"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Devise</label>
              <select
                value={form.currency}
                onChange={(e) => update("currency", e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="USD">USD ($)</option>
                <option value="CDF">CDF (FC)</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Catégorie</label>
            <select
              value={form.category_id}
              onChange={(e) => update("category_id", e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Aucune</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock status + quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Statut du stock</label>
              <div className="flex gap-2">
                {(
                  [
                    { value: "in_stock", label: "En stock" },
                    { value: "order", label: "Sur commande" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("stock_status", opt.value)}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                      form.stock_status === opt.value
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border bg-white hover:bg-muted",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Quantité disponible
              </label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => update("quantity", e.target.value)}
                disabled={form.stock_status === "order"}
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                placeholder="0"
              />
            </div>
          </div>

          {/* Featured */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <button
              type="button"
              onClick={() => update("featured", !form.featured)}
              className={cn(
                "flex h-6 w-11 items-center rounded-full transition-colors",
                form.featured ? "bg-primary" : "bg-muted-foreground/30",
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                  form.featured ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-primary" />
              Produit en vedette
            </span>
          </label>

          {/* Images */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Images du produit</label>
            <p className={cn("text-xs font-semibold", form.images.length + imageFiles.length < 5 ? "text-amber-700" : "text-emerald-700")}>
              {form.images.length + imageFiles.length}/5 images minimum
            </p>
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.images.map((img, index) => (
                  <div
                    key={img}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <img
                      src={img}
                      alt={`Image existante ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        update(
                          "images",
                          form.images.filter(
                            (_, imageIndex) => imageIndex !== index,
                          ),
                        )
                      }
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-destructive shadow"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1 flex gap-1"><button type="button" aria-label="Déplacer l’image vers la gauche" onClick={() => moveExistingImage(index, -1)} className="rounded bg-white/90 px-1.5 text-xs shadow">←</button><button type="button" aria-label="Déplacer l’image vers la droite" onClick={() => moveExistingImage(index, 1)} className="rounded bg-white/90 px-1.5 text-xs shadow">→</button></div>
                  </div>
                ))}
              </div>
            )}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={preview}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-primary/30 bg-muted"
                  >
                    <img
                      src={preview}
                      alt={`Nouvelle image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(index)}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-destructive shadow"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1 flex gap-1"><button type="button" aria-label="Déplacer l’image vers la gauche" onClick={() => moveSelectedImage(index, -1)} className="rounded bg-white/90 px-1.5 text-xs shadow">←</button><button type="button" aria-label="Déplacer l’image vers la droite" onClick={() => moveSelectedImage(index, 1)} className="rounded bg-white/90 px-1.5 text-xs shadow">→</button></div>
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                      {imageFiles[index]?.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-4 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageFiles(e.target.files)}
                className="sr-only"
              />
              <Plus className="h-4 w-4" />
              Sélectionner des images à importer
            </label>
            {imageFiles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {imageFiles.length} nouvelle(s) image(s) prête(s) à être
                importée(s).
              </p>
            )}
            {product && product.images.length < 5 && <p className="text-xs font-semibold text-amber-700">Ancien produit incomplet : {product.images.length} image(s). Ajoutez des images pour atteindre le minimum recommandé de 5.</p>}
          </div>

          {/* Variants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Variantes</label>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter une variante
              </button>
            </div>
            {form.variants.map((variant, vIndex) => (
              <div
                key={vIndex}
                className="rounded-xl border border-border p-4 space-y-3 bg-muted/20"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) =>
                      updateVariant(vIndex, "name", e.target.value)
                    }
                    className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Nom (ex: Capacité)"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(vIndex)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
                <div className="space-y-2">
                  {variant.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) =>
                          updateVariantOption(vIndex, oIndex, e.target.value)
                        }
                        className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                        placeholder={`Option ${oIndex + 1}`}
                      />
                      {variant.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariantOption(vIndex, oIndex)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-destructive/10"
                        >
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addVariantOption(vIndex)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter une option
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {product ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

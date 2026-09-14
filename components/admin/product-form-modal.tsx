"use client";

import { useState } from "react";
import { X, Plus, Trash2, Loader2, Star } from "lucide-react";
import {
  ProductWithCategory,
  Category,
  StockStatus,
  VariantGroup,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface FormData {
  name: string;
  description: string;
  price: string;
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
    price: product?.price?.toString() || "",
    category_id: product?.category_id || categories[0]?.id || "",
    stock_status: product?.stock_status || "order",
    quantity: product?.quantity?.toString() || "0",
    variants: product?.variants || [],
    images: product?.images || [""],
    featured: product?.featured || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const update = (
    field: keyof FormData,
    value: string | boolean | VariantGroup[] | string[],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (index: number, value: string) => {
    const images = [...form.images];
    images[index] = value;
    update("images", images);
  };

  const addImage = () => update("images", [...form.images, ""]);
  const removeImage = (index: number) => {
    const images = form.images.filter((_, i) => i !== index);
    update("images", images.length ? images : [""]);
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
    setError("");
    if (!form.name.trim()) {
      setError("Le nom est requis.");
      return;
    }
    if (!form.price || parseFloat(form.price) < 0) {
      setError("Prix invalide.");
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: parseFloat(form.price),
          category_id: form.category_id || null,
          stock_status: form.stock_status,
          quantity: parseInt(form.quantity) || 0,
          variants: form.variants.filter(
            (v) => v.name.trim() && v.options.some((o) => o.trim()),
          ),
          images: form.images.filter((img) => img.trim()),
          featured: form.featured,
        },
        imageFiles,
      );
    } catch (err) {
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
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder="Description du produit..."
            />
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Prix (USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="1250"
              />
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
            <div className="space-y-2">
              {form.images.map((img, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="url"
                    value={img}
                    onChange={(e) => handleImageChange(i, e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="https://images.pexels.com/..."
                  />
                  {form.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addImage}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter une image
            </button>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-4 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageFiles(e.target.files)}
                className="sr-only"
              />
              <Plus className="h-4 w-4" />
              Importer des images dans Supabase Storage
            </label>
            {imageFiles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {imageFiles.length} nouvelle(s) image(s) prête(s) à être
                importée(s).
              </p>
            )}
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

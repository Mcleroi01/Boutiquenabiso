'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, FolderTree, X, Loader2 } from 'lucide-react';
import { getCategories, getProducts, createCategory, updateCategory, deleteCategory } from '@/lib/data';
import { Category, Product } from '@/lib/types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [c, p] = await Promise.all([getCategories(), getProducts()]);
    setCategories(c);
    setProducts(p);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openModal = (cat: Category | null) => {
    setEditing(cat);
    setName(cat?.name || '');
    setSlug(cat?.slug || '');
    setIcon(cat?.icon || '');
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) { setError('Nom et slug requis.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateCategory(editing.id, { name: name.trim(), slug: slug.trim(), icon: icon.trim() || null });
      } else {
        await createCategory(name.trim(), slug.trim(), icon.trim() || undefined);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ? Les produits associés ne seront pas supprimés.')) return;
    setDeletingId(id);
    try {
      await deleteCategory(id);
      await loadData();
    } finally {
      setDeletingId(null);
    }
  };

  const productCount = (catId: string) => products.filter((p) => p.category_id === catId).length;

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catégories</h1>
          <p className="text-sm text-muted-foreground mt-1">{categories.length} catégories.</p>
        </div>
        <button
          onClick={() => openModal(null)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Ajouter une catégorie
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:shadow-sm transition-all">
            <div className="space-y-1">
              <p className="font-semibold text-sm">{cat.name}</p>
              <p className="text-xs text-muted-foreground">
                {productCount(cat.id)} produit{productCount(cat.id) !== 1 ? 's' : ''} • /{cat.slug}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openModal(cat)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                disabled={deletingId === cat.id}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 disabled:opacity-50"
              >
                {deletingId === cat.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <FolderTree className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Aucune catégorie.</p>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold">{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
              <button onClick={() => setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="iPhones"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Slug (URL) *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="iphones"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Icône (nom Lucide)</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Smartphone"
                />
                <p className="text-xs text-muted-foreground">Ex: Smartphone, Headphones, Laptop, Shirt, Package</p>
              </div>
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

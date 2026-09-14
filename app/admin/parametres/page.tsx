'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Loader2, Save, Check } from 'lucide-react';
import { getSettings, updateSetting } from '@/lib/data';

export default function AdminSettingsPage() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setWhatsappNumber(s.whatsapp_number || '');
        setStoreName(s.store_name || '');
        setStoreDescription(s.store_description || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        updateSetting('whatsapp_number', whatsappNumber.trim()),
        updateSetting('store_name', storeName.trim()),
        updateSetting('store_description', storeDescription.trim()),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Configurez les informations de votre boutique.</p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <SettingsIcon className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold">Informations générales</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Nom de la boutique</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="BOUTIQUE NA BISO"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Description</label>
          <textarea
            value={storeDescription}
            onChange={(e) => setStoreDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            placeholder="Votre intermédiaire de confiance..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Numéro WhatsApp</label>
          <input
            type="text"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="243812345678"
          />
          <p className="text-xs text-muted-foreground">
            Format international sans le + (ex: 243812345678 pour la RDC).
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 animate-fade-in">
              <Check className="h-4 w-4" />
              Enregistré !
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

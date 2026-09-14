'use client';

import { useState } from 'react';
import { FileText, Info, Link2, Send, ShoppingBag } from 'lucide-react';
import { buildQuoteMessage, buildWhatsAppLink } from '@/lib/whatsapp';
import { PlatformsSection } from './platform-mark';

export function DevisClient({ whatsappNumber }: { whatsappNumber: string }) {
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!link.trim()) {
      setError('Veuillez coller le lien du produit.');
      return;
    }
    setError('');
    const message = buildQuoteMessage(link.trim(), description.trim());
    window.open(buildWhatsAppLink(whatsappNumber, message), '_blank');
  };

  return (
    <div className="container-page py-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Demander un devis</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Vous avez trouvé un produit sur une plateforme chinoise ? Envoyez-nous le lien et nous vous répondons avec le prix, les options et la livraison à Kinshasa.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">Plateformes prises en charge</p>
            <PlatformsSection compact />
          </div>
        </div>

        <div className="brand-surface rounded-2xl p-5 md:p-8">
          <div className="mb-6 border-b border-border/70 pb-5">
            <h2 className="text-lg font-bold">Informations du produit</h2>
            <p className="mt-1 text-sm text-muted-foreground">Le devis part directement sur WhatsApp.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold">
                <Link2 className="h-4 w-4 text-primary" />
                Lien du produit
              </label>
              <input
                type="url"
                placeholder="https://detail.1688.com/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="focus-ring w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
              />
              {error && <p className="text-xs font-medium text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Description optionnelle
              </label>
              <textarea
                placeholder="Ex: iPhone 15 Pro Max 256GB, couleur titane naturel, SIM physique..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="focus-ring w-full resize-none rounded-xl border border-border bg-white px-4 py-3 text-sm"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!whatsappNumber}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-900/10 transition-all hover:-translate-y-0.5 hover:bg-[#1fb45a] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Envoyer la demande sur WhatsApp
            </button>

            <div className="flex items-start gap-2.5 rounded-2xl bg-accent/60 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Ajoutez les détails importants comme la couleur, la capacité, la taille, le modèle SIM ou WiFi. Plus la demande est précise, plus le devis sera rapide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

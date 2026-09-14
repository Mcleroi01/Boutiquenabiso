import { MapPin, MessageCircle, PackageCheck, ShoppingBag } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/70 bg-slate-950 text-white">
      <div className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-950">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-sm font-black">BOUTIQUE NA BISO</span>
                <span className="text-xs text-white/60">Import Chine - Kinshasa</span>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/70">
              Votre intermédiaire de confiance pour acheter des produits en Chine et les recevoir à Kinshasa.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold">Contact</h3>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <MessageCircle className="h-4 w-4 text-emerald-300" />
              <span>Commandes via WhatsApp</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <MapPin className="h-4 w-4 text-emerald-300" />
              <span>Kinshasa, RDC</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold">Services</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-amber-200" />
                Catalogue de produits
              </li>
              <li>Demande de devis personnalisé</li>
              <li>Commande simple sur WhatsApp</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-center text-xs text-white/50">
            © {new Date().getFullYear()} BOUTIQUE NA BISO. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

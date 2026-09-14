import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { DevisClient } from '@/components/devis-client';
import { getSettings } from '@/lib/data';

export const revalidate = 60;

export default async function DevisPage() {
  const settings = await getSettings();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <DevisClient whatsappNumber={settings.whatsapp_number || ''} />
      </main>
      <SiteFooter />
    </div>
  );
}

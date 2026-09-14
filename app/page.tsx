import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CatalogClient } from '@/components/catalog-client';
import { getProducts, getCategories, getSettings } from '@/lib/data';

export const revalidate = 60;

export default async function HomePage() {
  const [products, categories, settings] = await Promise.all([
    getProducts(),
    getCategories(),
    getSettings(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <CatalogClient
          products={products}
          categories={categories}
          whatsappNumber={settings.whatsapp_number || ''}
          storeName={settings.store_name || 'BOUTIQUE NA BISO'}
          storeDescription={settings.store_description || ''}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

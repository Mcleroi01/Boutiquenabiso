import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ProductDetailClient } from '@/components/product-detail-client';
import { getProductById, getSettings } from '@/lib/data';

export const revalidate = 60;

export default async function ProductPage({ params }: { params: { id: string } }) {
  const [product, settings] = await Promise.all([
    getProductById(params.id),
    getSettings(),
  ]);

  if (!product) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <ProductDetailClient
          product={product}
          whatsappNumber={settings.whatsapp_number || ''}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

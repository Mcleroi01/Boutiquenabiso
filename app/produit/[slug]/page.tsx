import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductDetailClient } from "@/components/product-detail-client";
import { getProductById, getProductBySlug, getSettings } from "@/lib/data";

export const revalidate = 60;

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");
const defaultImage = `${siteUrl}/images/product-placeholder.svg`;

function metadataDescription(description: string | null, name: string): string {
  const plainText = (description || `Découvrez ${name} chez BOUTIQUE NA BISO.`)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plainText.slice(0, 160);
}

async function resolveProduct(slug: string) {
  const product = await getProductBySlug(slug);
  if (product) return product;

  // Keep old UUID links usable while every new link uses the slug.
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    slug,
  )
    ? getProductById(slug)
    : null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await resolveProduct(params.slug);
  if (!product) return { title: "Produit introuvable | BOUTIQUE NA BISO" };

  const description = metadataDescription(product.description, product.name);
  const image = product.images?.[0] || defaultImage;
  const url = `${siteUrl}/produit/${product.slug || params.slug}`;

  return {
    title: `${product.name} | BOUTIQUE NA BISO`,
    description,
    openGraph: {
      title: product.name,
      description,
      url,
      type: "website",
      siteName: "BOUTIQUE NA BISO",
      images: [{ url: image, width: 1200, height: 630, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const [product, settings] = await Promise.all([
    resolveProduct(params.slug),
    getSettings(),
  ]);
  if (!product) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <ProductDetailClient
          product={product}
          whatsappNumber={settings.whatsapp_number || ""}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

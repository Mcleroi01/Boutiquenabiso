import { Product } from './types';

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function buildWhatsAppLink(whatsappNumber: string, message: string): string {
  const cleaned = whatsappNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function buildOrderMessage(
  product: Product,
  variantSelections: Record<string, string> = {},
  quantity: number = 1
): string {
  const variantParts = Object.entries(variantSelections)
    .map(([name, value]) => `${name}: ${value}`)
    .join(', ');

  const variantLine = variantParts ? `Variante : ${variantParts}` : 'Variante : Aucune';

  return `Bonjour BOUTIQUE NA BISO, je veux commander cet article :
Produit : ${product.name}
Prix : ${formatPrice(product.price)}
${variantLine}
Quantité : ${quantity}

Merci de me donner les détails.`;
}

export function buildQuoteMessage(productLink: string, description: string = ''): string {
  const descLine = description ? `\nDescription : ${description}` : '';
  return `Bonjour BOUTIQUE NA BISO, je veux demander un devis pour ce produit :
Lien : ${productLink}${descLine}

Merci de me donner le prix et les détails.`;
}

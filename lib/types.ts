export type StockStatus = 'in_stock' | 'order';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'purchased'
  | 'transit'
  | 'arrived'
  | 'delivered'
  | 'cancelled';

export type QuoteStatus = 'pending' | 'reviewing' | 'quoted' | 'accepted' | 'rejected' | 'converted';

export type QuotePlatform = 'Pinduoduo' | 'Xianyu' | '1688' | 'Alibaba' | 'Shein' | 'Autre' | 'Non précisée';

export interface VariantGroup {
  name: string;
  options: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  purchase_price: number;
  selling_price: number;
  currency: string;
  category_id: string | null;
  stock_status: StockStatus;
  quantity: number;
  variants: VariantGroup[];
  images: string[];
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  full_name?: string;
  whatsapp?: string;
  image_path?: string | null;
  image_paths?: string[] | null;
  message?: string | null;
  customer_name: string;
  customer_phone: string;
  platform: QuotePlatform | null;
  product_link: string | null;
  product_description: string;
  quantity: number;
  image_url: string | null;
  status: QuoteStatus;
  proposed_price: number | null;
  admin_note: string | null;
  converted_order_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteImage {
  id: string;
  quote_id: string;
  storage_path: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  created_at: string;
}

export interface ProductWithCategory extends Product {
  category?: Category | null;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Nouvelle commande',
  confirmed: 'Confirmée',
  purchased: 'Achetée en Chine',
  transit: 'En transit',
  arrived: 'Arrivée à Kinshasa',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-amber-100 text-amber-700 border-amber-200',
  purchased: 'bg-purple-100 text-purple-700 border-purple-200',
  transit: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  arrived: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: 'En attente',
  reviewing: 'En analyse',
  quoted: 'Devis envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  converted: 'Converti en commande',
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  reviewing: 'bg-blue-100 text-blue-700 border-blue-200',
  quoted: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  converted: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

export const QUOTE_STATUSES = Object.keys(QUOTE_STATUS_LABELS) as QuoteStatus[];

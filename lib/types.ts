export type StockStatus = 'in_stock' | 'order';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'purchased'
  | 'transit'
  | 'arrived'
  | 'delivered'
  | 'cancelled';

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
  description: string | null;
  price: number;
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

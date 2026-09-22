export type StockStatus = "in_stock" | "order";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "payment_pending"
  | "paid"
  | "purchasing"
  | "purchased"
  | "shipping_to_agency"
  | "arrived_at_agency"
  | "in_transit"
  | "arrived_in_kinshasa"
  | "ready_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded";

export type QuoteStatus =
  | "pending"
  | "reviewing"
  | "quoted"
  | "accepted"
  | "rejected"
  | "converted";

export type QuotePlatform =
  | "Pinduoduo"
  | "Xianyu"
  | "1688"
  | "Alibaba"
  | "Shein"
  | "Autre"
  | "Non précisée";

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
  order_number: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  product_id: string | null;
  product_name: string;
  variant_selection: Record<string, string>;
  quantity: number;
  price: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_cost: number;
  total_estimated: number;
  currency: string;
  delivery_city: string | null;
  customer_note: string | null;
  admin_note: string | null;
  tracking_number: string | null;
  carrier: string | null;
  estimated_delivery: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  delivery_accuracy: number | null;
  delivery_location_updated_at: string | null;
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
  pending: "Commande reçue",
  confirmed: "Confirmée",
  payment_pending: "Paiement en attente",
  paid: "Paiement confirmé",
  purchasing: "Achat en Chine",
  purchased: "Achetée en Chine",
  shipping_to_agency: "En route vers l'agence",
  arrived_at_agency: "Arrivée à l'agence",
  in_transit: "En transport vers Kinshasa",
  arrived_in_kinshasa: "Arrivée à Kinshasa",
  ready_for_delivery: "Prête pour livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-amber-100 text-amber-700 border-amber-200",
  payment_pending: "bg-orange-100 text-orange-700 border-orange-200",
  paid: "bg-green-100 text-green-700 border-green-200",
  purchasing: "bg-violet-100 text-violet-700 border-violet-200",
  purchased: "bg-purple-100 text-purple-700 border-purple-200",
  shipping_to_agency: "bg-cyan-100 text-cyan-700 border-cyan-200",
  arrived_at_agency: "bg-teal-100 text-teal-700 border-teal-200",
  in_transit: "bg-cyan-100 text-cyan-700 border-cyan-200",
  arrived_in_kinshasa: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ready_for_delivery: "bg-lime-100 text-lime-700 border-lime-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: "En attente",
  reviewing: "En analyse",
  quoted: "Devis envoyé",
  accepted: "Accepté",
  rejected: "Refusé",
  converted: "Converti en commande",
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  reviewing: "bg-blue-100 text-blue-700 border-blue-200",
  quoted: "bg-cyan-100 text-cyan-700 border-cyan-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  converted: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export const QUOTE_STATUSES = Object.keys(QUOTE_STATUS_LABELS) as QuoteStatus[];

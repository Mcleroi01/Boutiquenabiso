import { supabase } from './supabase';
import { Category, Product, ProductWithCategory, Order, Setting, OrderStatus, Quote, QuotePlatform, QuoteStatus, PaymentStatus } from './types';
import { slugifyProductName } from './product-slug';

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getProducts(): Promise<ProductWithCategory[]> {
  let { data, error } = await supabase.from('public_catalog_products').select('*').order('created_at', { ascending: false });
  if (error?.code === 'PGRST205') {
    console.warn('[catalog] vue publique absente, lecture de compatibilité');
    ({ data, error } = await supabase.from('products').select('id,name,slug,description,price,category_id,stock_status,quantity,variants,images,featured,created_at,updated_at').order('created_at', { ascending: false }));
  }
  const { data: categories, error: categoryError } = await Promise.all([
    supabase.from('categories').select('*').order('name'),
  ]).then(([result]) => result);
  if (error) throw error;
  if (categoryError) throw categoryError;
  return (data ?? []).map((product) => ({
    ...product,
    purchase_price: 0,
    selling_price: product.price,
    currency: product.currency || 'USD',
    category: (categories ?? []).find((category) => category.id === product.category_id) ?? null,
  })) as ProductWithCategory[];
}

export async function getAdminProducts(): Promise<ProductWithCategory[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProductBySlug(slug: string): Promise<ProductWithCategory | null> {
  let { data, error } = await supabase.from('public_catalog_products').select('*').eq('slug', slug).maybeSingle();
  if (error?.code === 'PGRST205') {
    ({ data, error } = await supabase.from('products').select('id,name,slug,description,price,category_id,stock_status,quantity,variants,images,featured,created_at,updated_at').eq('slug', slug).maybeSingle());
  }
  if (error) throw error;
  if (!data) return null;
  return { ...data, purchase_price: 0, selling_price: data.price, currency: data.currency || 'USD' } as ProductWithCategory;
}

export async function getProductById(id: string): Promise<ProductWithCategory | null> {
  const { data, error } = await supabase.from('products').select('*, category:categories(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as ProductWithCategory | null;
}

export async function getFeaturedProducts(): Promise<ProductWithCategory[]> {
  let { data, error } = await supabase
    .from('public_catalog_products')
    .select('*')
    .eq('featured', true)
    .order('created_at', { ascending: false });
  if (error?.code === 'PGRST205') {
    ({ data, error } = await supabase.from('products').select('id,name,slug,description,price,category_id,stock_status,quantity,variants,images,featured,created_at,updated_at').eq('featured', true).order('created_at', { ascending: false }));
  }
  if (error) throw error;
  return (data ?? []).map((product) => ({ ...product, purchase_price: 0, selling_price: product.price, currency: product.currency || 'USD' })) as ProductWithCategory[];
}

export async function getSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('settings').select('*');
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const s of data ?? []) {
    map[s.key] = s.value;
  }
  return map;
}

export type VisitorAnalytics = {
  totalVisitors: number;
  activeVisitors: number;
  totalPageViews: number;
  authenticatedVisitors: number;
  topPages: { path: string; views: number }[];
  recentVisitors: {
    id: string;
    user_id: string | null;
    user_name: string | null;
    user_email: string | null;
    last_path: string;
    page_views: number;
    device_type: string;
    last_seen_at: string;
  }[];
};

export async function getVisitorAnalytics(): Promise<VisitorAnalytics> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [visitorsResult, viewsResult, profilesResult] = await Promise.all([
    supabase
      .from('site_visitors')
      .select('id,user_id,last_path,page_views,device_type,last_seen_at')
      .order('last_seen_at', { ascending: false }),
    supabase
      .from('site_page_views')
      .select('path,user_id,viewed_at')
      .gte('viewed_at', since),
    supabase.from('profiles').select('id,full_name,email'),
  ]);
  if (visitorsResult.error) throw visitorsResult.error;
  if (viewsResult.error) throw viewsResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const visitors = visitorsResult.data ?? [];
  const views = viewsResult.data ?? [];
  const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const pageCounts = new Map<string, number>();
  for (const view of views) pageCounts.set(view.path, (pageCounts.get(view.path) || 0) + 1);

  return {
    totalVisitors: visitors.length,
    activeVisitors: visitors.filter((visitor) => visitor.last_seen_at >= since).length,
    totalPageViews: views.length,
    authenticatedVisitors: new Set(visitors.filter((visitor) => visitor.user_id).map((visitor) => visitor.id)).size,
    topPages: [...pageCounts.entries()]
      .sort(([, first], [, second]) => second - first)
      .slice(0, 8)
      .map(([path, count]) => ({ path, views: count })),
    recentVisitors: visitors.slice(0, 12).map((visitor) => ({
      ...visitor,
      user_name: profiles.get(visitor.user_id || '')?.full_name || null,
      user_email: profiles.get(visitor.user_id || '')?.email || null,
    })),
  };
}

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createOrder(input: {
  customer_name: string;
  customer_phone: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
  status: OrderStatus;
  notes?: string;
}): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createClientOrder(input: {
  product_id?: string | null;
  product_name: string;
  quantity: number;
  price: number;
  shipping_cost?: number;
  currency?: string;
  delivery_city: string;
  customer_phone: string;
  customer_note?: string | null;
  variant_selection?: Record<string, string>;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  delivery_accuracy?: number | null;
}): Promise<Order> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Connexion client requise.');
  const shippingCost = input.shipping_cost || 0;
  const { data, error } = await supabase.from('orders').insert({
    customer_id: userData.user.id,
    order_number: await nextOrderNumber(),
    product_id: input.product_id || null,
    product_name: input.product_name,
    customer_name: userData.user.user_metadata?.full_name || userData.user.email || 'Client',
    customer_phone: input.customer_phone,
    quantity: input.quantity,
    price: input.price,
    shipping_cost: shippingCost,
    total_estimated: input.price * input.quantity + shippingCost,
    currency: input.currency || 'USD',
    delivery_city: input.delivery_city,
    customer_note: input.customer_note || null,
    variant_selection: input.variant_selection || {},
    delivery_latitude: input.delivery_latitude ?? null,
    delivery_longitude: input.delivery_longitude ?? null,
    delivery_accuracy: input.delivery_accuracy ?? null,
    delivery_location_updated_at: input.delivery_latitude != null ? new Date().toISOString() : null,
    status: 'pending',
    payment_status: 'unpaid',
  }).select().single();
  if (error) throw error;
  return data;
}

async function nextOrderNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('next_order_number');
  if (error) throw error;
  return data as string;
}

export async function getClientOrders(): Promise<Order[]> {
  const { data, error } = await supabase.from('orders').select('*').eq('customer_id', (await supabase.auth.getUser()).data.user?.id || '').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getClientProfile() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error('Connexion client requise.');
  const { data, error } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
  if (error) throw error;
  return { ...data, email: authData.user.email || '' };
}

export async function updateClientProfile(input: { full_name: string; phone: string; city?: string; address?: string; neighborhood?: string }) {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error('Connexion client requise.');
  const { error } = await supabase.from('profiles').update(input).eq('id', authData.user.id);
  if (error) throw error;
}

export async function updateClientLocation(location: { latitude: number; longitude: number; accuracy?: number | null }) {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error('Connexion client requise.');
  const { error } = await supabase.from('profiles').update({ location_latitude: location.latitude, location_longitude: location.longitude, location_accuracy: location.accuracy ?? null, location_updated_at: new Date().toISOString() }).eq('id', authData.user.id);
  if (error) throw error;
}

export async function getClientOrderHistory(orderId: string) {
  const { data, error } = await supabase.from('order_status_history').select('id,order_id,status,comment,created_at').eq('order_id', orderId).order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function getClientOrderByNumber(orderNumber: string) {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error('Connexion client requise.');
  const { data, error } = await supabase.from('orders').select('*').eq('order_number', orderNumber).eq('customer_id', authData.user.id).maybeSingle();
  if (error) throw error;
  return data as Order | null;
}

export async function getClientNotifications() {
  const { data: authData } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', authData.user?.id || '').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAdminClients() {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'user').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateOrderStatus(id: string, status: OrderStatus, notes?: string): Promise<void> {
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (notes !== undefined) update.notes = notes;
  const { error } = await supabase.from('orders').update(update).eq('id', id);
  if (error) throw error;
}

export async function updateOrderDetails(id: string, input: { status?: OrderStatus; tracking_number?: string | null; carrier?: string | null; estimated_delivery?: string | null; shipping_cost?: number; payment_status?: PaymentStatus; admin_note?: string | null }): Promise<void> {
  const { error } = await supabase.from('orders').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

export async function getQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createQuote(input: {
  full_name: string;
  whatsapp: string;
  platform?: QuotePlatform | null;
  product_link?: string | null;
  product_description: string;
  quantity: number;
  image_path?: string | null;
  image_paths?: string[] | null;
  message?: string | null;
}): Promise<Quote> {
  console.info('[quote] insertion démarrée', { hasImage: Boolean(input.image_path) });
  const canonicalPayload = {
    ...input,
    customer_name: input.full_name,
    customer_phone: input.whatsapp,
    platform: input.platform || 'Non précisée',
    image_url: input.image_path ?? null,
  };
  const { data: rpcQuote, error: rpcError } = await supabase.rpc('submit_quote', {
    quote_full_name: input.full_name,
    quote_whatsapp: input.whatsapp,
    quote_platform: input.platform || 'Non précisée',
    quote_product_link: input.product_link ?? null,
    quote_product_description: input.product_description,
    quote_quantity: input.quantity,
    quote_image_paths: input.image_paths ?? [],
    quote_message: input.message ?? null,
  });
  if (!rpcError && rpcQuote) {
    console.info('[quote] insertion réussie avec ses images');
    return rpcQuote as Quote;
  }
  if (rpcError) console.warn('[quote] RPC indisponible, fallback insert', rpcError.message);
  let { error } = await supabase.from('quotes').insert(canonicalPayload);
  if (error?.code === 'PGRST204' && error.message.includes("'image_paths'")) {
    console.warn('[quote] colonne image_paths absente, insertion sans cette colonne');
    const { image_paths: _imagePaths, ...payloadWithoutImagePaths } = canonicalPayload;
    ({ error } = await supabase.from('quotes').insert(payloadWithoutImagePaths));
  }
  if (error?.code === 'PGRST204' && error.message.includes("'full_name'")) {
    console.warn('[quote] schéma canonique absent, utilisation du schéma legacy quotes');
    const legacyDescription = `${input.product_description}${input.message ? `\n\nDétails : ${input.message}` : ''}`;
    ({ error } = await supabase.from('quotes').insert({
      customer_name: input.full_name,
      customer_phone: input.whatsapp,
      platform: input.platform || 'Non précisée',
      product_link: input.product_link ?? null,
      product_description: legacyDescription,
      quantity: input.quantity,
      image_url: input.image_path ?? null,
    }));
  }
  if (error) {
    console.error('[quote] insertion échouée', error);
    throw new Error(error.message || 'Supabase a refusé la demande de devis.');
  }
  console.info('[quote] insertion réussie');
  return {
    ...input,
    id: '',
    customer_name: input.full_name,
    customer_phone: input.whatsapp,
    image_url: input.image_path ?? null,
    image_paths: input.image_paths ?? (input.image_path ? [input.image_path] : null),
    status: 'pending',
    proposed_price: null,
    admin_note: null,
    converted_order_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Quote;
}

export async function updateQuote(id: string, input: {
  status?: QuoteStatus;
  proposed_price?: number | null;
  admin_note?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('quotes').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function convertQuote(id: string, unitPrice: number, notes?: string | null): Promise<Order> {
  const { data, error } = await supabase.rpc('convert_quote_to_order', {
    quote_id: id,
    unit_price: unitPrice,
    order_notes: notes ?? null,
  });
  if (error) throw error;
  return data;
}

export async function uploadPublicImage(bucket: 'quote-images' | 'product-images', file: File, path: string): Promise<string> {
  console.info('[storage] upload image démarré', { bucket, path, size: file.size, type: file.type });
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) {
    console.error('[storage] upload image échoué', error);
    throw new Error(error.message || 'Supabase Storage a refusé l’image.');
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  console.info('[storage] upload image terminé', { bucket, path });
  return data.publicUrl;
}

export async function deleteProductStorageImages(imageUrls: string[]): Promise<void> {
  const prefix = '/storage/v1/object/public/product-images/';
  const paths = imageUrls
    .filter((url) => url.includes(prefix))
    .map((url) => url.split(prefix)[1])
    .filter(Boolean);
  if (!paths.length) return;
  const { error } = await supabase.storage.from('product-images').remove(paths);
  if (error) throw error;
}

export async function syncProductImages(productId: string, imageUrls: string[]): Promise<void> {
  console.info('[product] synchronisation product_images', { productId, imageCount: imageUrls.length });
  const { error: deleteError } = await supabase.from('product_images').delete().eq('product_id', productId);
  if (deleteError) {
    console.error('[product] erreur suppression product_images', deleteError);
    throw new Error(deleteError.message || 'Impossible de synchroniser les images du produit.');
  }
  if (!imageUrls.length) return;
  const { error } = await supabase.from('product_images').insert(
    imageUrls.map((image_url, sort_order) => ({ product_id: productId, image_url, storage_path: getStoragePath('product-images', image_url), sort_order })),
  );
  if (error) {
    console.error('[product] erreur insertion product_images', error);
    throw new Error(error.message || 'Impossible d’enregistrer les images du produit.');
  }
  console.info('[product] product_images synchronisées', { productId, imageCount: imageUrls.length });
}

function getStoragePath(bucket: string, publicUrl: string): string {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marker);
  return index >= 0 ? decodeURIComponent(publicUrl.slice(index + marker.length)) : publicUrl;
}

export async function createProduct(input: Omit<Product, 'id' | 'slug' | 'created_at' | 'updated_at'>): Promise<Product | null> {
  const slug = await getUniqueProductSlug(input.name);
  console.info('[product] début insertion Supabase', {
    name: input.name,
    purchase_price: input.purchase_price,
    selling_price: input.selling_price,
    currency: input.currency,
  });
  const { data, error } = await supabase.from('products').insert({ ...input, slug }).select().single();
  if (error) {
    console.error('[product] erreur Supabase insertion', error);
    throw new Error(error.message || 'Supabase a refusé la création du produit.');
  }
  console.info('[product] insertion Supabase terminée', { id: data?.id });
  return data;
}

export async function updateProduct(id: string, input: Partial<Product>): Promise<void> {
  console.info('[product] début mise à jour Supabase', { id });
  const update = { ...input, ...(input.name ? { slug: await getUniqueProductSlug(input.name, id) } : {}), updated_at: new Date().toISOString() };
  const { error } = await supabase.from('products').update(update).eq('id', id);
  if (error) {
    console.error('[product] erreur Supabase mise à jour', error);
    throw new Error(error.message || 'Supabase a refusé la mise à jour du produit.');
  }
  console.info('[product] mise à jour Supabase terminée', { id });
}

async function getUniqueProductSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugifyProductName(name);
  const { data, error } = await supabase.from('products').select('id, slug').like('slug', `${base}%`);
  if (error) throw error;
  const used = new Set((data ?? []).filter((product) => product.id !== excludeId).map((product) => product.slug));
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function createCategory(name: string, slug: string, icon?: string): Promise<Category | null> {
  const { data, error } = await supabase.from('categories').insert({ name, slug, icon }).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, input: Partial<Category>): Promise<void> {
  const { error } = await supabase.from('categories').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function updateSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}

import { supabase } from './supabase';
import { Category, Product, ProductWithCategory, Order, Setting, OrderStatus, Quote, QuotePlatform, QuoteStatus } from './types';
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

export async function updateOrderStatus(id: string, status: OrderStatus, notes?: string): Promise<void> {
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (notes !== undefined) update.notes = notes;
  const { error } = await supabase.from('orders').update(update).eq('id', id);
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

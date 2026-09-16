import { products as fallbackProducts, type Product } from "@/data/products";
import { createClient } from "@/lib/supabase/server";

const catalogueCategories = new Set<Product["category"]>([
  "Vegetables",
  "Fruits",
  "Seedlings",
  "Livestock",
]);

function toCategory(value: string | undefined): Product["category"] {
  return value && catalogueCategories.has(value as Product["category"])
    ? (value as Product["category"])
    : "Vegetables";
}

export async function getPublishedProducts(): Promise<Product[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return fallbackProducts;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "slug, name, price_ngn, price_prefix, selling_unit, status, image_path, image_alt, product_categories(name)",
    )
    .in("status", ["available", "limited", "unavailable"])
    .not("published_at", "is", null)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Unable to load the produce catalogue", error.message);
    return fallbackProducts;
  }

  return data.map((product) => ({
    id: product.slug,
    name: product.name,
    category: toCategory(product.product_categories?.name),
    price: product.price_ngn,
    pricePrefix: product.price_prefix ?? undefined,
    unit: product.selling_unit,
    status: product.status as Product["status"],
    image: product.image_path ?? "/images/products/seedlings.jpg",
    imageAlt: product.image_alt ?? product.name,
  }));
}

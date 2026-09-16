import { Storefront } from "@/components/storefront";
import { getPublishedProducts } from "@/lib/products";

export default async function Home() {
  const products = await getPublishedProducts();

  return <Storefront products={products} />;
}

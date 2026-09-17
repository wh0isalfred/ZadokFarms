import { Storefront } from "@/components/storefront";
import { getPublishedProducts } from "@/lib/products";

// Also prevents a missing-configuration/error result from being prerendered.
export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getPublishedProducts();

  if (products === null) {
    return (
      <main className="page-shell">
        <section className="no-results" aria-labelledby="catalogue-error">
          <h1 id="catalogue-error">Produce catalogue unavailable</h1>
          <p>We could not load current prices and availability. Please try again.</p>
          <form action="/" method="get"><button type="submit">Reload catalogue</button></form>
        </section>
      </main>
    );
  }

  return <Storefront products={products} />;
}

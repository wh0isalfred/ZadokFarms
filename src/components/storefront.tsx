"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { BasketDrawer } from "@/components/basket-drawer";
import { useBasket } from "@/components/use-basket";
import { ArrowIcon, ChevronIcon, LocationIcon, SearchIcon } from "@/components/icons";
import { FarmClose, FarmServices, FarmStory, BulkSupply, OrderSteps, SiteFooter } from "@/components/home-sections";
import { MobileNav } from "@/components/mobile-nav";
import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { categories, type Category, type Product } from "@/data/products";

function CatalogueSweep({ className = "" }: { className?: string }) {
  return (
    <svg className={`catalogue-lines catalogue-sweep ${className}`} viewBox="0 0 960 420" fill="none" aria-hidden="true">
      <path d="M-24 34C132 32 128 126 310 148C522 174 616 238 846 390" />
      <path d="M-30 82C116 80 122 158 296 182C496 210 584 268 798 406" />
      <path d="M-36 130C100 128 112 190 282 218C466 248 548 300 748 418" />
    </svg>
  );
}

export function Storefront({ products }: { products: Product[] }) {
  const [category, setCategory] = useState<Category>("All produce");
  const [query, setQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState("farm");
  const [showSearch, setShowSearch] = useState(false);
  const [basketOpen, setBasketOpen] = useState(false);
  const { quantities, add, decrease } = useBasket(products);

  const visibleProducts = useMemo(() => {
    const matches = products.filter((product) => {
      const categoryMatch = category === "All produce" || product.category === category;
      const availabilityMatch = !availableOnly || product.status === "available" || product.status === "limited";
      return categoryMatch && availabilityMatch && product.name.toLowerCase().includes(query.trim().toLowerCase());
    });
    // The incoming array already follows Supabase display_order. Never sort it in place.
    if (sort !== "farm") matches.sort((a, b) => (sort === "name-asc" ? 1 : -1) * a.name.localeCompare(b.name, "en"));
    return matches;
  }, [availableOnly, category, products, query, sort]);

  function resetFilters() {
    setCategory("All produce");
    setQuery("");
    setAvailableOnly(false);
    setSort("farm");
  }

  const basketCount = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.12 });

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [availableOnly, category, query, sort]);

  return (
    <>
      <div className="page-shell" id="top">
        <SiteHeader basketCount={basketCount} onBasketOpen={() => setBasketOpen(true)} onSearchOpen={() => setShowSearch((open) => !open)} />
        <main>
          <div className="provenance"><LocationIcon /><span>Grown in Omudioga. Available directly from our farm.</span></div>
          <section className={`search-panel ${showSearch ? "open" : ""}`} aria-hidden={!showSearch}>
            <SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search produce" aria-label="Search produce" autoFocus={showSearch} />{query && <button type="button" onClick={() => setQuery("")}>Clear</button>}
          </section>
          <section className="catalogue" id="produce">
            <svg className="catalogue-lines catalogue-opening-bands" viewBox="0 0 800 240" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false">
              <path d="M0 144L800 -56" /><path d="M0 184L800 -16" />
              <path d="M0 224L800 24" /><path d="M0 264L800 64" />
            </svg>
            <div className="catalogue-heading"><div><h1>Available from the farm</h1><p>Prices and availability may change. Zadok confirms fulfilment and payment afterward.</p></div><button type="button" onClick={resetFilters}>View all produce</button></div>
            <div className="catalogue-toolbar"><div className="category-list" aria-label="Produce categories">{categories.map((item) => <button className={category === item ? "active" : ""} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} key={item}>{item}{item === "All produce" ? ` (${products.length})` : ""}</button>)}</div><div className="desktop-filters">
              <button type="button" aria-pressed={availableOnly} onClick={() => setAvailableOnly((value) => !value)}>Available now</button>
              <label className="catalogue-sort"><select aria-label="Sort produce" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="farm">Sort: farm order</option><option value="name-asc">Name: A-Z</option><option value="name-desc">Name: Z-A</option>
              </select><ChevronIcon /></label>
            </div></div>
            {visibleProducts.length > 0 ? (
              <div className="product-grid">
                {visibleProducts.map((product, index) => (
                  <Fragment key={product.id}>
                    <ProductCard product={product} quantity={quantities[product.id] ?? 0} onAdd={() => add(product.id)} onDecrease={() => decrease(product.id)} />
                    {category === "All produce" && !query && index === 3 && (
                      <aside className="mobile-discovery">
                        <div><span>MORE FROM ZADOK</span><strong>Training &amp; farm services</strong></div>
                        <a href="#services">Explore <ArrowIcon /></a>
                      </aside>
                    )}
                    {category === "All produce" && !query && index === 8 && (
                      <aside className="mobile-update"><div><p className="eyebrow">FROM THE FARM</p><strong>This week in Omudioga</strong><span>Harvest and availability change with the season.</span></div><a href="#farm">Read update →</a></aside>
                    )}
                  </Fragment>
                ))}
                {category === "All produce" && !query && <><CatalogueSweep /><FarmStory /></>}
              </div>
            ) : <div className="no-results"><p>{products.length === 0 ? "No produce is currently published." : <>No produce matches these filters{query ? ` for "${query}"` : ""}.</>}</p><button type="button" onClick={resetFilters}>Show all produce</button></div>}
          </section>
          <BulkSupply />
          <OrderSteps />
          <FarmServices />
          <FarmClose />
        </main>
      </div>
      <SiteFooter />
      <MobileNav />
      <BasketDrawer open={basketOpen} products={products} quantities={quantities} onClose={() => setBasketOpen(false)} onAdd={add} onDecrease={decrease} />
    </>
  );
}

"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { BasketDrawer } from "@/components/basket-drawer";
import { LocationIcon, SearchIcon } from "@/components/icons";
import { FarmClose, FarmServices, FarmStory, BulkSupply, OrderSteps, SiteFooter } from "@/components/home-sections";
import { MobileNav } from "@/components/mobile-nav";
import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { categories, type Category, products } from "@/data/products";

export function Storefront() {
  const [category, setCategory] = useState<Category>("All produce");
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [basketOpen, setBasketOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const visibleProducts = useMemo(() => products.filter((product) => {
    const categoryMatch = category === "All produce" || product.category === category;
    return categoryMatch && product.name.toLowerCase().includes(query.trim().toLowerCase());
  }), [category, query]);

  const basketCount = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
  const add = (id: string) => setQuantities((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
  const decrease = (id: string) => setQuantities((current) => ({ ...current, [id]: Math.max((current[id] ?? 0) - 1, 0) }));

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
  }, [category, query]);

  return (
    <>
      <div className="page-shell" id="top">
        <SiteHeader basketCount={basketCount} onBasketOpen={() => setBasketOpen(true)} onSearchOpen={() => setShowSearch((open) => !open)} />
        <main>
          <div className="provenance"><LocationIcon /><span>Grown in Omudioga. Available directly from our farm.</span><span className="provenance-location">Omudioga, Rivers State</span></div>
          <section className={`search-panel ${showSearch ? "open" : ""}`} aria-hidden={!showSearch}>
            <SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search produce" aria-label="Search produce" autoFocus={showSearch} />{query && <button type="button" onClick={() => setQuery("")}>Clear</button>}
          </section>
          <section className="catalogue" id="produce">
            <div className="catalogue-toolbar"><div className="category-list" aria-label="Produce categories">{categories.map((item) => <button className={category === item ? "active" : ""} type="button" onClick={() => setCategory(item)} key={item}>{item}{item === "All produce" ? ` (${products.length})` : ""}</button>)}</div><div className="desktop-filters"><button type="button">Available now</button><button type="button">Sort</button></div></div>
            <div className="catalogue-heading"><div><h1>Available from the farm</h1><p>Prices shown for concept only.</p></div><button type="button" onClick={() => { setCategory("All produce"); setQuery(""); }}>View all produce</button></div>
            {visibleProducts.length > 0 ? (
              <div className="product-grid">
                {visibleProducts.map((product, index) => (
                  <Fragment key={product.id}>
                    <ProductCard product={product} quantity={quantities[product.id] ?? 0} onAdd={() => add(product.id)} onDecrease={() => decrease(product.id)} />
                    {category === "All produce" && !query && index === 3 && (
                      <aside className="mobile-discovery"><strong>Beyond produce</strong><a href="#training">Training →</a><a href="#services">Farm services →</a></aside>
                    )}
                    {category === "All produce" && !query && index === 7 && (
                      <aside className="mobile-update"><div><p className="eyebrow">FROM THE FARM</p><strong>This week in Omudioga</strong><span>Harvest and availability change with the season.</span></div><a href="#farm">Read update →</a></aside>
                    )}
                  </Fragment>
                ))}
                {category === "All produce" && !query && <FarmStory />}
              </div>
            ) : <div className="no-results"><p>No produce matches “{query}”.</p><button type="button" onClick={() => { setQuery(""); setCategory("All produce"); }}>Show all produce</button></div>}
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BasketIcon, SearchIcon } from "@/components/icons";

type PublicHeaderProps = {
  basketCount?: number;
  onBasketOpen?: () => void;
  onSearchOpen?: () => void;
};

export function PublicHeader({ basketCount = 0, onBasketOpen, onSearchOpen }: PublicHeaderProps) {
  const pathname = usePathname() ?? "/";
  const isShopActive = pathname === "/";
  const isTrainingActive = pathname.startsWith("/training");

  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Zadok Farms home">
        ZADOK FARMS
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        <Link href="/" className={isShopActive ? "active" : ""}>
          Shop
        </Link>
        <Link href="/training" className={isTrainingActive ? "active" : ""}>
          Training
        </Link>
        <Link href="/#services">Services</Link>
        <Link href="/#farm">Our farm</Link>
        <Link href="/#about">About</Link>
      </nav>
      <div className="header-actions">
        {onSearchOpen ? (
          <button className="search-trigger" type="button" onClick={onSearchOpen} aria-label="Search produce">
            <SearchIcon /> <span>Search</span>
          </button>
        ) : (
          <div className="search-trigger" aria-label="Search produce">
            <SearchIcon /> <span>Search</span>
          </div>
        )}
        <span className="header-divider" aria-hidden="true" />
        {onBasketOpen ? (
          <button
            className="basket-trigger"
            type="button"
            onClick={onBasketOpen}
            aria-label={basketCount > 0 ? `Your basket, ${basketCount} items` : "Your basket, empty"}
          >
            <span className="basket-icon-wrap">
              <BasketIcon />
              {basketCount > 0 && <span className="basket-badge" key={basketCount}>{basketCount}</span>}
            </span>
            <span>Your basket</span>
          </button>
        ) : (
          <div
            className="basket-trigger"
            role="button"
            tabIndex={-1}
            aria-label="Your basket"
          >
            <span className="basket-icon-wrap">
              <BasketIcon />
            </span>
            <span>Your basket</span>
          </div>
        )}
      </div>
    </header>
  );
}

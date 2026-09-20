import { BasketIcon, SearchIcon } from "@/components/icons";

type SiteHeaderProps = {
  basketCount: number;
  searchOpen: boolean;
  onBasketOpen: () => void;
  onSearchOpen: () => void;
};

export function SiteHeader({ basketCount, searchOpen, onBasketOpen, onSearchOpen }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="Zadok Farm home">ZADOK FARM</a>
      <nav className="desktop-nav" aria-label="Main navigation">
        <a className="active" href="#produce" aria-current="page">Shop</a>
        <a href="#training">Training</a>
        <a href="#services">Services</a>
        <a href="#farm">Our farm</a>
        <a href="#about">About</a>
      </nav>
      <div className="header-actions">
        <button className="search-trigger" type="button" onClick={onSearchOpen} aria-label="Search produce" aria-expanded={searchOpen} aria-controls="catalogue-search">
          <SearchIcon /> <span>Search</span>
        </button>
        <span className="header-divider" aria-hidden="true" />
        <button className="basket-trigger" type="button" onClick={onBasketOpen} aria-label={basketCount > 0 ? `Your basket, ${basketCount} items` : "Your basket, empty"}>
          <span className="basket-icon-wrap"><BasketIcon />{basketCount > 0 && <span className="basket-badge" key={basketCount}>{basketCount}</span>}</span>
          <span>Your basket &middot; {basketCount}</span>
        </button>
      </div>
    </header>
  );
}

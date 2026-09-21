import { Fragment } from "react";
import Link from "next/link";
import { BasketIcon, SearchIcon } from "@/components/icons";
import { SiteFooter } from "@/components/home-sections";
import { MobileNav } from "@/components/mobile-nav";

type LayoutProps = {
  children: React.ReactNode;
};

function TrainingHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Zadok Farms home">
        ZADOK FARMS
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        <Link href="/">Shop</Link>
        <Link className="active" href="/training">
          Training
        </Link>
        <Link href="/#services">Services</Link>
        <Link href="/#farm">Our farm</Link>
        <Link href="/#about">About</Link>
      </nav>
      <div className="header-actions">
        <Link
          className="search-trigger"
          href="/"
          aria-label="Search produce"
        >
          <SearchIcon /> <span>Search</span>
        </Link>
        <span className="header-divider" aria-hidden="true" />
        <Link
          className="basket-trigger"
          href="/"
          aria-label="Your basket, empty"
        >
          <span className="basket-icon-wrap">
            <BasketIcon />
          </span>
          <span>Your basket</span>
        </Link>
      </div>
    </header>
  );
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Fragment>
      <TrainingHeader />
      {children}
      <SiteFooter />
      <MobileNav />
    </Fragment>
  );
}

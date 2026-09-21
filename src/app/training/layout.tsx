"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SiteFooter } from "@/components/home-sections";
import { MobileNav } from "@/components/mobile-nav";
import { SearchIcon } from "@/components/icons";

type LayoutProps = {
  children: React.ReactNode;
};

function TrainingNav() {
  const pathname = usePathname();
  const isTrainingActive = pathname.startsWith("/training");

  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Zadok Farms home">
        ZADOK FARMS
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        <Link href="/" className={!isTrainingActive ? "active" : ""}>Shop</Link>
        <Link href="/training" className={isTrainingActive ? "active" : ""}>
          Training
        </Link>
        <Link href="/#services">Services</Link>
        <Link href="/#farm">Our farm</Link>
        <Link href="/#about">About</Link>
      </nav>
      <div className="header-actions">
        <Link href="/" className="search-trigger" aria-label="Search produce">
          <SearchIcon /> <span>Search</span>
        </Link>
        <span className="header-divider" aria-hidden="true" />
        <Link href="/" className="basket-trigger" aria-label="Your basket">
          <svg className="basket-icon-wrap" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span>Your basket</span>
        </Link>
      </div>
    </header>
  );
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Fragment>
      <TrainingNav />
      {children}
      <SiteFooter />
      <MobileNav />
    </Fragment>
  );
}

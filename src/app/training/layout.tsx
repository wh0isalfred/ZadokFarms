"use client";

import { Fragment } from "react";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/home-sections";
import { MobileNav } from "@/components/mobile-nav";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <Fragment>
      <PublicHeader />
      {children}
      <SiteFooter />
      <MobileNav />
    </Fragment>
  );
}

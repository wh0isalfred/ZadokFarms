import { FarmIcon, MenuIcon, ServicesIcon, ShopIcon, TrainingIcon } from "@/components/icons";

const items = [
  { label: "Shop", href: "#produce", Icon: ShopIcon },
  { label: "Training", href: "#training", Icon: TrainingIcon },
  { label: "Services", href: "#services", Icon: ServicesIcon },
  { label: "Our farm", href: "#farm", Icon: FarmIcon },
  { label: "Menu", href: "#footer", Icon: MenuIcon },
];

export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {items.map(({ label, href, Icon }, index) => (
        <a className={index === 0 ? "active" : ""} href={href} key={label}>
          <Icon /><span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

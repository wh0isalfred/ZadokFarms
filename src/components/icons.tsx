import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export function SearchIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}

export function BasketIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="M4 9h16l-1.4 11H5.4L4 9Z" /><path d="m8 9 2-5h4l2 5" /></svg>;
}

export function ChevronIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="m8 10 4 4 4-4" /></svg>;
}

export function ArrowIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="M5 12h14M14 7l5 5-5 5" /></svg>;
}

export function ShopIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="M4 10.5V20h16v-9.5M3 4h18l-2 6H5L3 4Z" /><path d="M9 20v-6h6v6" /></svg>;
}

export function TrainingIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M7 12v4c2.8 2.2 7.2 2.2 10 0v-4" /></svg>;
}

export function ServicesIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><circle cx="12" cy="12" r="3" /><path d="M19 13.5V10.5l-2-.7-.8-1.8.9-1.9L15 4l-1.9.9L11.2 4H8.8L8 6l-1.8.8L4.2 6 2 8.2l.9 1.9L2 12v2.5l2 .7.8 1.8-.9 1.9L6 21l1.9-.9 1.9.9h3l.7-2 1.8-.8 1.9.9 2.1-2.1-.9-1.9.6-1.6Z" /></svg>;
}

export function FarmIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="M12 21v-8M12 13C8 13 5 10 5 6c4 0 7 2 7 7ZM12 15c4 0 7-3 7-7-4 0-7 2-7 7Z" /></svg>;
}

export function MenuIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

export function LocationIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
}

export function FacebookIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}><path d="M13.6 21v-8h2.8l.4-3h-3.2V8.1c0-.9.3-1.6 1.7-1.6H17V3.8c-.8-.1-1.6-.2-2.4-.2-2.5 0-4.2 1.5-4.2 4.3V10H7.6v3h2.8v8h3.2Z" /></svg>;
}

export function InstagramIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.1" /><circle cx="17.4" cy="6.7" r=".8" fill="currentColor" stroke="none" /></svg>;
}

export function WhatsAppIcon(props: IconProps) {
  return <svg {...iconProps} {...props}><path d="M20.2 11.8a8.2 8.2 0 0 1-12.1 7.3L3.5 20.4l1.2-4.5a8.2 8.2 0 1 1 15.5-4.1Z" /><path d="M8.2 7.5c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 1.9c.1.3.1.5-.1.7l-.7.9c-.2.2-.1.4 0 .6.8 1.4 1.9 2.5 3.4 3.2.2.1.4.1.6-.1l.9-1.1c.2-.2.4-.3.7-.2l1.9.9c.3.1.4.3.4.5 0 .6-.3 1.5-.8 1.9-.5.5-1.3.8-2.1.7-1.2-.1-3.1-.7-5-2.4-1.5-1.4-2.6-3.1-2.9-4.4-.3-1.1 0-2.3.6-2.9l.6-.2Z" /></svg>;
}

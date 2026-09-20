import type { Metadata } from "next";
import "./staff.css";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Zadok Desk", robots: { index: false, follow: false }, referrer: "strict-origin" };
export default function StaffLayout({ children }: { children: React.ReactNode }) { return <div className="desk-world">{children}</div>; }

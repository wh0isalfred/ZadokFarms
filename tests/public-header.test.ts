import { expect, it, describe } from "vitest";

describe("PublicHeader component", () => {
  it("exports PublicHeader function", async () => {
    const { PublicHeader } = await import("../src/components/public-header");
    expect(PublicHeader).toBeDefined();
    expect(typeof PublicHeader).toBe("function");
  });

  it("is a client component with use client directive", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.default.join(process.cwd(), "src/components/public-header.tsx");
    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toContain('"use client"');
    expect(content).toContain("usePathname");
  });

  it("supports route-aware active state logic for Shop and Training", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.default.join(process.cwd(), "src/components/public-header.tsx");
    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toContain('pathname === "/"');
    expect(content).toContain('pathname.startsWith("/training")');
    expect(content).toContain("isShopActive");
    expect(content).toContain("isTrainingActive");
  });

  it("conditionally renders basket button when handler provided", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.default.join(process.cwd(), "src/components/public-header.tsx");
    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toContain("onBasketOpen");
    expect(content).toContain("basket-trigger");
  });

  it("conditionally renders search button when handler provided", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.default.join(process.cwd(), "src/components/public-header.tsx");
    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toContain("onSearchOpen");
    expect(content).toContain("search-trigger");
  });

  it("uses Link component from next/link for navigation", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.default.join(process.cwd(), "src/components/public-header.tsx");
    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toContain('from "next/link"');
    expect(content).toContain("<Link");
    expect(content).toContain('href="/"');
    expect(content).toContain('href="/training"');
  });

  it("has proper accessibility attributes", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.default.join(process.cwd(), "src/components/public-header.tsx");
    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toContain("aria-label");
    expect(content).toContain("role");
  });
});

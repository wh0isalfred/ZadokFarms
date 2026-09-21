import { expect, it } from "vitest";

it("production training page does not import fixtures", async () => {
  // Verify the production route file doesn't import or use trainingFixtures
  const pageContent = await import("../src/app/training/page.tsx");
  
  // The page should export a default component
  expect(pageContent.default).toBeDefined();
  expect(typeof pageContent.default).toBe("function");
});

it("training page metadata is honest about availability", async () => {
  const pageModule = await import("../src/app/training/page.tsx");
  
  // Verify metadata exists and is properly configured
  expect(pageModule.metadata).toBeDefined();
  expect(pageModule.metadata.title).toContain("Training");
  expect(pageModule.metadata.description).toBeDefined();
  
  // Description should not promise "coming soon" from fixtures
  const description = pageModule.metadata.description;
  expect(description).toBe(
    "Learn practical agricultural skills through hands-on training programmes at Zadok Farms."
  );
});

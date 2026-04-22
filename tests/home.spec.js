const { test, expect } = require("@playwright/test");

test.describe("Elephant Alpha landing page", () => {
  test("desktop homepage renders critical SEO and hero content", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Elephant Alpha/i);
    await expect(page.locator("h1")).toHaveText("Elephant Alpha");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /256K context/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://elephantalpha.lol/");
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Elephant Alpha");

    const primaryCta = page.getByRole("link", { name: "View on OpenRouter" });
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute("href", "https://mirofish.my");
    await expect(page.getByText("Independent editorial brief")).toBeVisible();
    await expect(page.getByRole("img", { name: "Elephant Alpha wordmark" })).toBeVisible();
    await expect(page.locator(".faq-list details")).toHaveCount(4);
    await expect(page.locator('script[src*="googletagmanager.com/gtag/js?id=G-Q6H3NZC8BE"]')).toHaveCount(1);
    await expect(page.locator('script[src*="clarity.ms/tag/"]')).toHaveCount(0);

    const headerMetrics = await page.evaluate(() => {
      const topbar = document.querySelector(".topbar");
      const brandImg = document.querySelector(".brand img");
      return {
        topbarHeight: topbar?.getBoundingClientRect().height ?? 0,
        brandHeight: brandImg?.getBoundingClientRect().height ?? 0
      };
    });
    expect(headerMetrics.topbarHeight).toBeLessThan(96);
    expect(headerMetrics.brandHeight).toBeLessThan(56);

    const imageUrls = await page.locator("img").evaluateAll((images) => images.map((image) => image.getAttribute("src")));
    for (const src of imageUrls) {
      const response = await page.request.get(src);
      expect(response.ok()).toBe(true);
    }
  });

  test("mobile layout stays inside the viewport and FAQ remains usable", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true
    });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page.locator("h1")).toBeVisible();
    await page.getByRole("link", { name: "Use Cases" }).click();
    await expect(page.locator("#use-cases")).toBeInViewport();

    const mobileLayout = await page.evaluate(() => {
      const topbar = document.querySelector(".topbar");
      const brandImg = document.querySelector(".brand img");
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        topbarHeight: topbar?.getBoundingClientRect().height ?? 0,
        brandHeight: brandImg?.getBoundingClientRect().height ?? 0
      };
    });
    expect(mobileLayout.topbarHeight).toBeLessThan(170);
    expect(mobileLayout.brandHeight).toBeLessThan(44);
    await expect(page.getByRole("link", { name: "API" })).toBeVisible();

    const overflow = mobileLayout.overflow;
    expect(overflow).toBeLessThanOrEqual(1);

    const faq = page.locator(".faq-list details").nth(1).locator("summary");
    await faq.click();
    await expect(page.getByText("256K context window and support for up to 32K output tokens.")).toBeVisible();

    await context.close();
  });

  test("supporting SEO files point at elephantalpha.lol", async ({ page }) => {
    const robots = await page.request.get("/robots.txt");
    expect(await robots.text()).toContain("https://elephantalpha.lol/sitemap.xml");

    const sitemap = await page.request.get("/sitemap.xml");
    expect(await sitemap.text()).toContain("<loc>https://elephantalpha.lol/</loc>");
    expect(await sitemap.text()).toContain("<lastmod>2026-04-19</lastmod>");

    const manifest = await page.request.get("/site.webmanifest");
    const manifestJson = await manifest.json();
    expect(manifestJson.name).toBe("Elephant Alpha");
    expect(manifestJson.icons[0].src).toBe("/assets/brand/favicon.png");
  });

  test("analytics scripts are injected when env ids are present", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.route("https://www.googletagmanager.com/**", async (route) => {
      await route.fulfill({ status: 200, body: "" });
    });
    await page.route("https://www.clarity.ms/**", async (route) => {
      await route.fulfill({ status: 200, body: "" });
    });

    await page.goto("/");
    await page.evaluate(() => {
      window.__ELEPHANT_ALPHA_CONFIG__.ga4MeasurementId = "G-TEST123456";
      window.__ELEPHANT_ALPHA_CONFIG__.clarityProjectId = "clarity123";
      window.__ELEPHANT_ALPHA_BOOT__.bootGa4();
      window.__ELEPHANT_ALPHA_BOOT__.bootClarity();
    });

    await expect(page.locator('script[src*="googletagmanager.com/gtag/js?id=G-TEST123456"]')).toHaveCount(1);
    await expect(page.locator('script[src="https://www.clarity.ms/tag/clarity123"]')).toHaveCount(1);

    await context.close();
  });
});

import { describe, it, expect } from "vitest";
import { customerSchema } from "../customer";
import { jobSchema } from "../job";
import { quoteSchema } from "../quote";
import { screenSchema } from "../screen";
import { colorSchema } from "../color";
import { garmentCatalogSchema } from "../garment";
import { artworkSchema } from "../artwork";
import {
  customers,
  jobs,
  quotes,
  screens,
  colors,
  garmentCatalog,
  artworks,
} from "@/lib/mock-data";

describe("mock data validates against schemas", () => {
  it("all customers are valid", () => {
    for (const customer of customers) {
      expect(() => customerSchema.parse(customer)).not.toThrow();
    }
  });

  it("all jobs are valid", () => {
    for (const job of jobs) {
      expect(() => jobSchema.parse(job)).not.toThrow();
    }
  });

  it("all quotes are valid", () => {
    for (const quote of quotes) {
      expect(() => quoteSchema.parse(quote)).not.toThrow();
    }
  });

  it("all screens are valid", () => {
    for (const screen of screens) {
      expect(() => screenSchema.parse(screen)).not.toThrow();
    }
  });

  it("all colors are valid", () => {
    for (const color of colors) {
      expect(() => colorSchema.parse(color)).not.toThrow();
    }
  });

  it("all garment catalog entries are valid", () => {
    for (const garment of garmentCatalog) {
      expect(() => garmentCatalogSchema.parse(garment)).not.toThrow();
    }
  });

  it("all artworks are valid", () => {
    for (const artwork of artworks) {
      expect(() => artworkSchema.parse(artwork)).not.toThrow();
    }
  });
});

describe("referential integrity", () => {
  it("all job customerIds reference existing customers", () => {
    const customerIds = new Set(customers.map((c) => c.id));
    for (const job of jobs) {
      expect(customerIds.has(job.customerId)).toBe(true);
    }
  });

  it("all quote customerIds reference existing customers", () => {
    const customerIds = new Set(customers.map((c) => c.id));
    for (const quote of quotes) {
      expect(customerIds.has(quote.customerId)).toBe(true);
    }
  });

  it("all screen jobIds reference existing jobs", () => {
    const jobIds = new Set(jobs.map((j) => j.id));
    for (const screen of screens) {
      expect(jobIds.has(screen.jobId)).toBe(true);
    }
  });

  it("all quote line item garmentIds reference existing catalog entries", () => {
    const garmentIds = new Set(garmentCatalog.map((g) => g.id));
    for (const quote of quotes) {
      for (const item of quote.lineItems) {
        expect(garmentIds.has(item.garmentId)).toBe(true);
      }
    }
  });

  it("all quote line item colorIds reference existing colors", () => {
    const colorIds = new Set(colors.map((c) => c.id));
    for (const quote of quotes) {
      for (const item of quote.lineItems) {
        expect(colorIds.has(item.colorId)).toBe(true);
      }
    }
  });

  it("all garment catalog availableColors reference existing colors", () => {
    const colorIds = new Set(colors.map((c) => c.id));
    for (const garment of garmentCatalog) {
      for (const colorId of garment.availableColors) {
        expect(colorIds.has(colorId)).toBe(true);
      }
    }
  });

  it("all artwork customerIds reference existing customers", () => {
    const customerIds = new Set(customers.map((c) => c.id));
    for (const artwork of artworks) {
      expect(customerIds.has(artwork.customerId)).toBe(true);
    }
  });

  it("all quote artworkIds reference existing artworks", () => {
    const artworkIds = new Set(artworks.map((a) => a.id));
    for (const quote of quotes) {
      for (const artworkId of quote.artworkIds) {
        expect(artworkIds.has(artworkId)).toBe(true);
      }
    }
  });

  it("all line item artworkIds reference existing artworks", () => {
    const artworkIds = new Set(artworks.map((a) => a.id));
    for (const quote of quotes) {
      for (const item of quote.lineItems) {
        for (const detail of item.printLocationDetails) {
          if (detail.artworkId) {
            expect(artworkIds.has(detail.artworkId)).toBe(true);
          }
        }
      }
    }
  });
});

describe("data coverage", () => {
  it("has at least 5 customers", () => {
    expect(customers.length).toBeGreaterThanOrEqual(5);
  });

  it("has at least 6 quotes", () => {
    expect(quotes.length).toBeGreaterThanOrEqual(6);
  });

  it("has at least 30 colors", () => {
    expect(colors.length).toBeGreaterThanOrEqual(30);
  });

  it("has at least 5 garment catalog entries", () => {
    expect(garmentCatalog.length).toBeGreaterThanOrEqual(5);
  });

  it("has at least 8 artworks", () => {
    expect(artworks.length).toBeGreaterThanOrEqual(8);
  });

  it("covers all quote statuses", () => {
    const statuses = new Set(quotes.map((q) => q.status));
    expect(statuses).toContain("draft");
    expect(statuses).toContain("sent");
    expect(statuses).toContain("accepted");
    expect(statuses).toContain("declined");
    expect(statuses).toContain("revised");
  });

  it("has favorite colors marked", () => {
    const favorites = colors.filter((c) => c.isFavorite);
    expect(favorites.length).toBeGreaterThanOrEqual(3);
  });

  it("has quotes with discounts", () => {
    const withDiscounts = quotes.filter((q) => q.discounts.length > 0);
    expect(withDiscounts.length).toBeGreaterThanOrEqual(2);
  });

  it("covers all customer tags", () => {
    const tags = new Set(customers.map((c) => c.tag));
    expect(tags).toContain("new");
    expect(tags).toContain("repeat");
    expect(tags).toContain("contract");
  });

  it("covers all discount types", () => {
    const types = new Set(
      quotes.flatMap((q) => q.discounts.map((d) => d.type))
    );
    expect(types).toContain("manual");
    expect(types).toContain("contract");
    expect(types).toContain("volume");
  });
});

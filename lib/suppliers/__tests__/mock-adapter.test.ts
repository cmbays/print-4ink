import { describe, it, expect, beforeEach } from 'vitest';
import { MockAdapter } from '../adapters/mock';
import { InMemoryCacheStore } from '../cache/in-memory';
import type { SupplierAdapter } from '../types';

describe('MockAdapter', () => {
  let adapter: SupplierAdapter;

  beforeEach(() => {
    adapter = new MockAdapter(new InMemoryCacheStore());
  });

  describe('supplierName', () => {
    it('is "mock"', () => {
      expect(adapter.supplierName).toBe('mock');
    });
  });

  describe('getStyle()', () => {
    it('returns null for unknown ID', async () => {
      expect(await adapter.getStyle('nonexistent')).toBeNull();
    });

    it('returns CanonicalStyle for known ID', async () => {
      // Use the FIRST garment's actual ID from garmentCatalog
      const allStyles = await (adapter as MockAdapter).searchCatalog({});
      const firstId = allStyles.styles[0].supplierId;
      const style = await adapter.getStyle(firstId);
      expect(style).not.toBeNull();
      expect(style?.supplierId).toBe(firstId);
      expect(style?.supplier).toBe('mock');
      expect(style?.styleNumber).toBeTruthy();
      expect(style?.brand).toBeTruthy();
      expect(style?.colors.length).toBeGreaterThan(0);
      expect(style?.sizes.length).toBeGreaterThan(0);
    });

    it('returned CanonicalStyle has null hex codes (mock data has none)', async () => {
      const allStyles = await (adapter as MockAdapter).searchCatalog({});
      const firstId = allStyles.styles[0].supplierId;
      const style = await adapter.getStyle(firstId);
      expect(style?.colors[0].hex1).toBeNull();
      expect(style?.colors[0].hex2).toBeNull();
    });

    it('returned CanonicalStyle has empty images array (mock has none)', async () => {
      const allStyles = await (adapter as MockAdapter).searchCatalog({});
      const firstId = allStyles.styles[0].supplierId;
      const style = await adapter.getStyle(firstId);
      expect(style?.colors[0].images).toEqual([]);
    });

    it('returned CanonicalStyle has valid pricing', async () => {
      const allStyles = await (adapter as MockAdapter).searchCatalog({});
      const firstId = allStyles.styles[0].supplierId;
      const style = await adapter.getStyle(firstId);
      expect(typeof style?.pricing.piecePrice).toBe('number');
      expect(style?.pricing.dozenPrice).toBeNull();
      expect(style?.pricing.casePrice).toBeNull();
    });

    it('returned CanonicalStyle has null GTIN (mock has none)', async () => {
      const allStyles = await (adapter as MockAdapter).searchCatalog({});
      const firstId = allStyles.styles[0].supplierId;
      const style = await adapter.getStyle(firstId);
      expect(style?.gtin).toBeNull();
    });
  });

  describe('getStylesBatch()', () => {
    it('returns array of CanonicalStyles for known IDs', async () => {
      const allStyles = await (adapter as MockAdapter).searchCatalog({});
      const ids = allStyles.styles.slice(0, 2).map(s => s.supplierId);
      const styles = await adapter.getStylesBatch(ids);
      expect(styles.length).toBe(2);
    });

    it('silently drops unknown IDs', async () => {
      const allStyles = await (adapter as MockAdapter).searchCatalog({});
      const ids = allStyles.styles.slice(0, 2).map(s => s.supplierId);
      const styles = await adapter.getStylesBatch([ids[0], 'nonexistent', ids[1]]);
      expect(styles.length).toBe(2);
    });

    it('returns empty array for all unknown IDs', async () => {
      const styles = await adapter.getStylesBatch(['x', 'y']);
      expect(styles).toEqual([]);
    });

    it('returns empty array for empty input', async () => {
      const styles = await adapter.getStylesBatch([]);
      expect(styles).toEqual([]);
    });
  });

  describe('searchCatalog()', () => {
    it('returns all styles with empty params', async () => {
      const result = await adapter.searchCatalog({});
      expect(result.styles.length).toBeGreaterThan(0);
      expect(typeof result.total).toBe('number');
      expect(typeof result.hasMore).toBe('boolean');
    });

    it('filters by brand', async () => {
      const allResult = await adapter.searchCatalog({});
      const firstBrand = allResult.styles[0].brand;
      const result = await adapter.searchCatalog({ brand: firstBrand });
      expect(result.styles.every(s => s.brand === firstBrand)).toBe(true);
    });

    it('filters by category', async () => {
      const allResult = await adapter.searchCatalog({});
      const firstCategory = allResult.styles[0].categories[0];
      const result = await adapter.searchCatalog({ category: firstCategory });
      expect(result.styles.every(s => s.categories.includes(firstCategory))).toBe(true);
    });

    it('respects limit', async () => {
      const result = await adapter.searchCatalog({ limit: 2 });
      expect(result.styles.length).toBeLessThanOrEqual(2);
    });

    it('returns hasMore true when results exceed limit', async () => {
      const allResult = await adapter.searchCatalog({});
      if (allResult.total > 1) {
        const limited = await adapter.searchCatalog({ limit: 1 });
        expect(limited.hasMore).toBe(true);
      }
    });
  });

  describe('getInventory()', () => {
    it('returns a record of skuId to qty', async () => {
      const inventory = await adapter.getInventory(['sku-1', 'sku-2']);
      expect(typeof inventory).toBe('object');
    });

    it('mock returns 999 for any SKU (simulates in-stock)', async () => {
      const inventory = await adapter.getInventory(['any-sku']);
      expect(inventory['any-sku']).toBe(999);
    });

    it('returns empty object for empty input', async () => {
      const inventory = await adapter.getInventory([]);
      expect(inventory).toEqual({});
    });
  });

  describe('getBrands()', () => {
    it('returns a non-empty array of strings', async () => {
      const brands = await adapter.getBrands();
      expect(brands.length).toBeGreaterThan(0);
      expect(brands.every(b => typeof b === 'string')).toBe(true);
    });

    it('returns sorted brands', async () => {
      const brands = await adapter.getBrands();
      expect(brands).toEqual([...brands].sort());
    });

    it('returns deduplicated brands', async () => {
      const brands = await adapter.getBrands();
      expect(brands.length).toBe(new Set(brands).size);
    });
  });

  describe('getCategories()', () => {
    it('returns a non-empty array of strings', async () => {
      const cats = await adapter.getCategories();
      expect(cats.length).toBeGreaterThan(0);
    });

    it('returns deduplicated categories', async () => {
      const cats = await adapter.getCategories();
      expect(cats.length).toBe(new Set(cats).size);
    });
  });

  describe('healthCheck()', () => {
    it('returns healthy: true', async () => {
      const health = await adapter.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.supplier).toBe('mock');
      expect(health.checkedAt).toBeInstanceOf(Date);
    });
  });
});

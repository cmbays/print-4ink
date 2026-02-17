import { describe, it, expect, afterEach } from 'vitest';
import { getSupplierAdapter, _resetSupplierAdapter } from '../registry';

describe('getSupplierAdapter()', () => {
  const originalEnv = process.env.SUPPLIER_ADAPTER;

  afterEach(() => {
    _resetSupplierAdapter();
    if (originalEnv === undefined) {
      delete process.env.SUPPLIER_ADAPTER;
    } else {
      process.env.SUPPLIER_ADAPTER = originalEnv;
    }
  });

  it('throws when SUPPLIER_ADAPTER is not set', () => {
    delete process.env.SUPPLIER_ADAPTER;
    expect(() => getSupplierAdapter()).toThrow('SUPPLIER_ADAPTER');
  });

  it('throws when SUPPLIER_ADAPTER is an invalid value', () => {
    process.env.SUPPLIER_ADAPTER = 'bogus';
    expect(() => getSupplierAdapter()).toThrow('SUPPLIER_ADAPTER');
  });

  it('returns MockAdapter when SUPPLIER_ADAPTER=mock', () => {
    process.env.SUPPLIER_ADAPTER = 'mock';
    const adapter = getSupplierAdapter();
    expect(adapter.supplierName).toBe('mock');
  });

  it('returns the same instance on repeated calls (singleton)', () => {
    process.env.SUPPLIER_ADAPTER = 'mock';
    const a = getSupplierAdapter();
    const b = getSupplierAdapter();
    expect(a).toBe(b);
  });

  it('_resetSupplierAdapter clears singleton', () => {
    process.env.SUPPLIER_ADAPTER = 'mock';
    const a = getSupplierAdapter();
    _resetSupplierAdapter();
    const b = getSupplierAdapter();
    expect(a).not.toBe(b);
  });

  it('throws for ss-activewear (not yet implemented)', () => {
    process.env.SUPPLIER_ADAPTER = 'ss-activewear';
    expect(() => getSupplierAdapter()).toThrow('not yet implemented');
  });
});

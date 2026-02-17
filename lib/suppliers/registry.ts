import { DalError } from '@infra/repositories/_shared/errors';
import { InMemoryCacheStore } from './cache/in-memory';
import { MockAdapter } from './adapters/mock';
import { supplierNameSchema } from './types';
import type { SupplierAdapter, SupplierName } from './types';

const VALID_ADAPTERS = supplierNameSchema.options;

let _adapter: SupplierAdapter | null = null;

export function getSupplierAdapter(): SupplierAdapter {
  if (_adapter) return _adapter;

  const name = process.env.SUPPLIER_ADAPTER;
  // `includes` requires a cast: string is not narrowable to SupplierName via overload resolution
  if (!name || !VALID_ADAPTERS.includes(name as SupplierName)) {
    throw new DalError(
      'PROVIDER',
      `SUPPLIER_ADAPTER must be one of [${VALID_ADAPTERS.join(', ')}], got: '${name}'`,
    );
  }

  const cache = new InMemoryCacheStore();

  if (name === 'mock') {
    _adapter = new MockAdapter(cache);
    return _adapter;
  }

  throw new DalError('PROVIDER', `Adapter '${name}' not yet implemented`);
}

/** For testing only — resets the singleton so tests get a fresh adapter. */
export function _resetSupplierAdapter(): void {
  _adapter = null;
}

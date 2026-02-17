import { DalError } from '@/lib/dal/_shared/errors';
import { InMemoryCacheStore } from './cache/in-memory';
import { MockAdapter } from './adapters/mock';
import type { SupplierAdapter } from './types';

const VALID_ADAPTERS = ['mock', 'ss-activewear'] as const;
type AdapterName = (typeof VALID_ADAPTERS)[number];

let _adapter: SupplierAdapter | null = null;

export function getSupplierAdapter(): SupplierAdapter {
  if (_adapter) return _adapter;

  const name = process.env.SUPPLIER_ADAPTER;
  if (!name || !VALID_ADAPTERS.includes(name as AdapterName)) {
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

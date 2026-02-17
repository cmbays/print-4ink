import { DalError } from '../_shared/errors';

const VALID_PROVIDERS = ['mock', 'supabase'] as const;
export type ProviderName = (typeof VALID_PROVIDERS)[number];

export function getProviderName(): ProviderName {
  const name = process.env.DATA_PROVIDER;
  if (!name) {
    throw new DalError('PROVIDER', `DATA_PROVIDER env var is not set. Must be one of [${VALID_PROVIDERS.join(', ')}].`);
  }
  if (!VALID_PROVIDERS.includes(name as ProviderName)) {
    throw new DalError('PROVIDER', `DATA_PROVIDER must be one of [${VALID_PROVIDERS.join(', ')}], got: '${name}'`);
  }
  return name as ProviderName;
}

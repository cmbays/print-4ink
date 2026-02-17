import { describe, it, expect, vi, afterEach } from 'vitest';
import { getProviderName } from '../_providers';
import { DalError } from '@infra/repositories/_shared/errors';

describe('getProviderName()', () => {
  const originalDataProvider = process.env.DATA_PROVIDER;

  afterEach(() => {
    vi.unstubAllEnvs();
    // Restore the original value for the delete case
    if (originalDataProvider !== undefined) {
      process.env.DATA_PROVIDER = originalDataProvider;
    }
  });

  it("returns 'mock' when DATA_PROVIDER is 'mock'", () => {
    vi.stubEnv('DATA_PROVIDER', 'mock');
    expect(getProviderName()).toBe('mock');
  });

  it("returns 'supabase' when DATA_PROVIDER is 'supabase'", () => {
    vi.stubEnv('DATA_PROVIDER', 'supabase');
    expect(getProviderName()).toBe('supabase');
  });

  it('throws DalError when DATA_PROVIDER is empty string', () => {
    vi.stubEnv('DATA_PROVIDER', '');
    expect(() => getProviderName()).toThrow(DalError);
    expect(() => getProviderName()).toThrow(/DATA_PROVIDER env var is not set/);
  });

  it('throws DalError when DATA_PROVIDER is undefined', () => {
    delete process.env.DATA_PROVIDER;
    expect(() => getProviderName()).toThrow(DalError);
  });

  it('throws DalError with PROVIDER code when DATA_PROVIDER is invalid', () => {
    vi.stubEnv('DATA_PROVIDER', 'postgres');
    expect(() => getProviderName()).toThrow(DalError);
    expect(() => getProviderName()).toThrow(/postgres/);
  });
});

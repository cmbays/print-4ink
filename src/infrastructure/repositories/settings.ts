// Auth classification: AUTHENTICATED — shop configuration including pricing data.
// Phase 2: All functions must call verifySession() before returning data.
export {
  getMockupTemplates,
  getBrandPreferences,
  getDisplayPreference,
  getAutoPropagationConfig,
  getDtfSheetTiers,
  getBrandPreferencesMutable,
  getAutoPropagationConfigMutable,
  getDtfSheetTiersSync,
} from '@infra/repositories/_providers/mock/settings'

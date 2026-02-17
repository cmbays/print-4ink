import { z } from 'zod'
import {
  reviewRuleSchema,
  compositionPolicySchema,
  agentRegistryEntrySchema,
  domainMappingSchema,
  type ReviewRule,
  type CompositionPolicy,
  type AgentRegistryEntry,
  type DomainMapping,
} from '@domain/entities/review-config'

import rulesJson from '@/config/review-rules.json'
import compositionJson from '@/config/review-composition.json'
import agentsJson from '@/config/review-agents.json'
import domainsJson from '@/config/review-domains.json'

// ---------------------------------------------------------------------------
// Validated config loaders
//
// Each loader validates the raw JSON through z.array(schema).parse() and
// returns typed data. Pipeline stages (#340) import from here — never from
// raw JSON directly.
//
// Object.freeze() provides shallow runtime immutability (array-level). The
// `readonly T[]` return type is the primary guard — TypeScript prevents
// nested field mutation at compile time.
// ---------------------------------------------------------------------------

export function loadReviewRules(): readonly ReviewRule[] {
  return Object.freeze(z.array(reviewRuleSchema).parse(rulesJson))
}

export function loadCompositionPolicies(): readonly CompositionPolicy[] {
  return Object.freeze(z.array(compositionPolicySchema).parse(compositionJson))
}

export function loadAgentRegistry(): readonly AgentRegistryEntry[] {
  return Object.freeze(z.array(agentRegistryEntrySchema).parse(agentsJson))
}

export function loadDomainMappings(): readonly DomainMapping[] {
  return Object.freeze(z.array(domainMappingSchema).parse(domainsJson))
}

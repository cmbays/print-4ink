import { z } from 'zod'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const severityEnum = z.enum(['critical', 'major', 'warning', 'info'])

export const ruleScopeEnum = z.enum(['local', 'cross-file', 'architectural'])

export const reviewRiskLevelEnum = z.enum(['low', 'medium', 'high', 'critical'])

// ---------------------------------------------------------------------------
// Review Rule
// ---------------------------------------------------------------------------

export const reviewRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  concern: z.string().min(1),
  severity: severityEnum,
  agent: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(10),
  detection: z.string().min(10),
  recommendation: z.string().min(10),
  goodExample: z.string().optional(),
  scope: ruleScopeEnum,
})

// ---------------------------------------------------------------------------
// Composition Policy — Trigger Conditions (discriminated union)
// ---------------------------------------------------------------------------

export const alwaysTriggerSchema = z.object({
  type: z.literal('always'),
})

export const domainTriggerSchema = z.object({
  type: z.literal('domain'),
  domains: z.array(z.string().min(1)).min(1),
})

export const riskTriggerSchema = z.object({
  type: z.literal('risk'),
  riskLevel: reviewRiskLevelEnum,
})

export const contentTriggerSchema = z.object({
  type: z.literal('content'),
  pattern: z.string().min(1),
})

export const triggerConditionSchema = z.discriminatedUnion('type', [
  alwaysTriggerSchema,
  domainTriggerSchema,
  riskTriggerSchema,
  contentTriggerSchema,
])

export const compositionPolicySchema = z.object({
  id: z.string().min(1),
  trigger: triggerConditionSchema,
  dispatch: z.string().min(1),
  priority: z.number().int().min(0).max(100),
  description: z.string().min(10),
})

// ---------------------------------------------------------------------------
// Agent Registry
// ---------------------------------------------------------------------------

export const agentRegistryEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tools: z.array(z.string().min(1)).min(1),
  capabilities: z.array(z.string().min(1)).min(1),
  description: z.string().min(10),
  outputFormat: z.enum(['json', 'markdown']),
})

// ---------------------------------------------------------------------------
// Domain Mapping
// ---------------------------------------------------------------------------

export const domainMappingSchema = z.object({
  pattern: z.string().min(1),
  domain: z.string().min(1),
  description: z.string().min(10),
})

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type Severity = z.infer<typeof severityEnum>
export type RuleScope = z.infer<typeof ruleScopeEnum>
export type ReviewRiskLevel = z.infer<typeof reviewRiskLevelEnum>
export type ReviewRule = z.infer<typeof reviewRuleSchema>
export type TriggerCondition = z.infer<typeof triggerConditionSchema>
export type CompositionPolicy = z.infer<typeof compositionPolicySchema>
export type AgentRegistryEntry = z.infer<typeof agentRegistryEntrySchema>
export type DomainMapping = z.infer<typeof domainMappingSchema>

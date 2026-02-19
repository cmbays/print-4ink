import fs from 'fs'
import path from 'path'
import { z } from 'zod'

/**
 * Load review configuration files from the config/ directory at project root.
 * Used by build-session-protocol Phase 2 (Self-Review) for deterministic PR review.
 */

// Zod schemas for validation
const reviewDomainSchema = z.object({
  label: z.string(),
  globs: z.array(z.string()),
})

const reviewDomainsConfigSchema = z.object({
  domains: z.record(reviewDomainSchema),
})

const reviewCompositionPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  agent: z.string(),
  priority: z.number(),
  trigger: z.object({
    type: z.enum(['always', 'domain', 'risk']),
    domains: z.array(z.string()).optional(),
    riskLevel: z.string().optional(),
  }),
  scope: z.string(),
})

const reviewCompositionConfigSchema = z.object({
  policies: z.array(reviewCompositionPolicySchema),
})

const reviewAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  capabilities: z.array(z.string()),
  domains: z.array(z.string()),
})

const reviewAgentsConfigSchema = z.object({
  agents: z.record(reviewAgentSchema),
})

const reviewRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  severity: z.enum(['info', 'warning', 'major', 'critical']),
  description: z.string(),
})

const reviewRulesConfigSchema = z.object({
  rules: z.record(reviewRuleSchema),
})

export type ReviewDomainsConfig = {
  domains: Record<
    string,
    {
      label: string
      globs: string[]
    }
  >
}

export type ReviewCompositionPolicy = {
  id: string
  name: string
  agent: string
  priority: number
  trigger: {
    type: 'always' | 'domain' | 'risk'
    domains?: string[]
    riskLevel?: string
  }
  scope: string
}

export type ReviewCompositionConfig = {
  policies: ReviewCompositionPolicy[]
}

export type ReviewAgent = {
  id: string
  name: string
  description: string
  capabilities: string[]
  domains: string[]
}

export type ReviewAgentsConfig = {
  agents: Record<string, ReviewAgent>
}

export type ReviewRule = {
  id: string
  name: string
  category: string
  severity: 'info' | 'warning' | 'major' | 'critical'
  description: string
}

export type ReviewRulesConfig = {
  rules: Record<string, ReviewRule>
}

/**
 * Load review-domains.json from project config/
 */
export function loadDomainConfig(): ReviewDomainsConfig {
  try {
    const configPath = path.join(process.cwd(), 'config', 'review-domains.json')
    const content = fs.readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(content)
    return reviewDomainsConfigSchema.parse(parsed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid review-domains.json configuration: ${error.errors.map((e) => e.message).join(', ')}`
      )
    }
    throw new Error(
      `Failed to load review-domains.json: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Load review-composition.json from project config/
 */
export function loadCompositionConfig(): ReviewCompositionConfig {
  try {
    const configPath = path.join(process.cwd(), 'config', 'review-composition.json')
    const content = fs.readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(content)
    return reviewCompositionConfigSchema.parse(parsed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid review-composition.json configuration: ${error.errors.map((e) => e.message).join(', ')}`
      )
    }
    throw new Error(
      `Failed to load review-composition.json: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Load review-agents.json from project config/
 */
export function loadAgentsConfig(): ReviewAgentsConfig {
  try {
    const configPath = path.join(process.cwd(), 'config', 'review-agents.json')
    const content = fs.readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(content)
    return reviewAgentsConfigSchema.parse(parsed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid review-agents.json configuration: ${error.errors.map((e) => e.message).join(', ')}`
      )
    }
    throw new Error(
      `Failed to load review-agents.json: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Load review-rules.json from project config/
 */
export function loadRulesConfig(): ReviewRulesConfig {
  try {
    const configPath = path.join(process.cwd(), 'config', 'review-rules.json')
    const content = fs.readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(content)
    return reviewRulesConfigSchema.parse(parsed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid review-rules.json configuration: ${error.errors.map((e) => e.message).join(', ')}`
      )
    }
    throw new Error(
      `Failed to load review-rules.json: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Load all review configs
 */
export function loadAllConfigs() {
  return {
    domains: loadDomainConfig(),
    composition: loadCompositionConfig(),
    agents: loadAgentsConfig(),
    rules: loadRulesConfig(),
  }
}

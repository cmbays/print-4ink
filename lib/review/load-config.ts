import fs from 'fs'
import path from 'path'

/**
 * Load review configuration files from the config/ directory at project root.
 * Used by build-session-protocol Phase 2 (Self-Review) for deterministic PR review.
 */

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
  const configPath = path.join(process.cwd(), 'config', 'review-domains.json')
  const content = fs.readFileSync(configPath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Load review-composition.json from project config/
 */
export function loadCompositionConfig(): ReviewCompositionConfig {
  const configPath = path.join(process.cwd(), 'config', 'review-composition.json')
  const content = fs.readFileSync(configPath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Load review-agents.json from project config/
 */
export function loadAgentsConfig(): ReviewAgentsConfig {
  const configPath = path.join(process.cwd(), 'config', 'review-agents.json')
  const content = fs.readFileSync(configPath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Load review-rules.json from project config/
 */
export function loadRulesConfig(): ReviewRulesConfig {
  const configPath = path.join(process.cwd(), 'config', 'review-rules.json')
  const content = fs.readFileSync(configPath, 'utf-8')
  return JSON.parse(content)
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

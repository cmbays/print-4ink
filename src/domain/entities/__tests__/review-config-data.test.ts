import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import {
  reviewRuleSchema,
  compositionPolicySchema,
  agentRegistryEntrySchema,
  domainMappingSchema,
} from '../review-config'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadJson<T>(filename: string): T {
  const filePath = resolve(__dirname, '../../../../config', filename)
  return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

// ---------------------------------------------------------------------------
// Load config files
// ---------------------------------------------------------------------------

const rules = loadJson<unknown[]>('review-rules.json')
const composition = loadJson<unknown[]>('review-composition.json')
const agents = loadJson<unknown[]>('review-agents.json')
const domains = loadJson<unknown[]>('review-domains.json')

// Pre-parse for cross-reference tests
const parsedRules = rules.map((r) => reviewRuleSchema.parse(r))
const parsedComposition = composition.map((c) => compositionPolicySchema.parse(c))
const parsedAgents = agents.map((a) => agentRegistryEntrySchema.parse(a))
const parsedDomains = domains.map((d) => domainMappingSchema.parse(d))
const agentIds = parsedAgents.map((a) => a.id)
const domainNames = [...new Set(parsedDomains.map((d) => d.domain))]

// ---------------------------------------------------------------------------
// review-agents.json
// ---------------------------------------------------------------------------

describe('review-agents.json', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(agents)).toBe(true)
    expect(agents.length).toBeGreaterThan(0)
  })

  it('every entry passes agentRegistryEntrySchema', () => {
    for (const entry of agents) {
      expect(() => agentRegistryEntrySchema.parse(entry)).not.toThrow()
    }
  })

  it('has no duplicate agent IDs', () => {
    expect(new Set(agentIds).size).toBe(agentIds.length)
  })

  it('contains expected agents', () => {
    expect(agentIds).toContain('build-reviewer')
    expect(agentIds).toContain('finance-sme')
    expect(agentIds).toContain('design-auditor')
  })

  it('every agent is dispatched by at least one composition policy', () => {
    const dispatchedAgents = new Set(parsedComposition.map((c) => c.dispatch))
    for (const agent of parsedAgents) {
      expect(dispatchedAgents).toContain(agent.id)
    }
  })
})

// ---------------------------------------------------------------------------
// review-domains.json
// ---------------------------------------------------------------------------

describe('review-domains.json', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(domains)).toBe(true)
    expect(domains.length).toBeGreaterThan(0)
  })

  it('every entry passes domainMappingSchema', () => {
    for (const entry of domains) {
      expect(() => domainMappingSchema.parse(entry)).not.toThrow()
    }
  })

  it('has no duplicate patterns', () => {
    const patterns = parsedDomains.map((d) => d.pattern)
    expect(new Set(patterns).size).toBe(patterns.length)
  })

  it('covers expected domains', () => {
    expect(domainNames).toContain('schemas')
    expect(domainNames).toContain('financial')
    expect(domainNames).toContain('dtf-optimization')
    expect(domainNames).toContain('ui-components')
    expect(domainNames).toContain('design-system')
    expect(domainNames).toContain('infrastructure')
    expect(domainNames).toContain('testing')
    expect(domainNames).toContain('data-layer')
    expect(domainNames).toContain('documentation')
  })
})

// ---------------------------------------------------------------------------
// review-composition.json
// ---------------------------------------------------------------------------

describe('review-composition.json', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(composition)).toBe(true)
    expect(composition.length).toBeGreaterThan(0)
  })

  it('every entry passes compositionPolicySchema', () => {
    for (const entry of composition) {
      expect(() => compositionPolicySchema.parse(entry)).not.toThrow()
    }
  })

  it('has no duplicate policy IDs', () => {
    const ids = parsedComposition.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has at least one universal (always) trigger policy', () => {
    const alwaysPolicies = parsedComposition.filter((c) => c.trigger.type === 'always')
    expect(alwaysPolicies.length).toBeGreaterThanOrEqual(1)
  })

  it('all dispatched agents exist in review-agents.json', () => {
    for (const policy of parsedComposition) {
      expect(agentIds).toContain(policy.dispatch)
    }
  })

  it('all domain trigger values exist in review-domains.json', () => {
    for (const policy of parsedComposition) {
      if (policy.trigger.type === 'domain') {
        for (const domain of policy.trigger.domains) {
          expect(domainNames).toContain(domain)
        }
      }
    }
  })
})

// ---------------------------------------------------------------------------
// review-rules.json
// ---------------------------------------------------------------------------

describe('review-rules.json', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(rules)).toBe(true)
    expect(rules.length).toBeGreaterThan(0)
  })

  it('every entry passes reviewRuleSchema', () => {
    for (const entry of rules) {
      expect(() => reviewRuleSchema.parse(entry)).not.toThrow()
    }
  })

  it('has no duplicate rule IDs', () => {
    const ids = parsedRules.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has at least 50 rules', () => {
    expect(rules.length).toBeGreaterThanOrEqual(50)
  })

  it('all agent references exist in review-agents.json', () => {
    for (const rule of parsedRules) {
      expect(agentIds).toContain(rule.agent)
    }
  })

  it('every rule has a description of at least 10 characters', () => {
    for (const rule of parsedRules) {
      expect(rule.description.length).toBeGreaterThanOrEqual(10)
    }
  })

  it('every rule has detection of at least 10 characters', () => {
    for (const rule of parsedRules) {
      expect(rule.detection.length).toBeGreaterThanOrEqual(10)
    }
  })

  it('every rule has recommendation of at least 10 characters', () => {
    for (const rule of parsedRules) {
      expect(rule.recommendation.length).toBeGreaterThanOrEqual(10)
    }
  })

  it('covers expected concern groups', () => {
    const concerns = [...new Set(parsedRules.map((r) => r.concern))]
    expect(concerns).toContain('dry-extraction')
    expect(concerns).toContain('modularity')
    expect(concerns).toContain('type-safety')
    expect(concerns).toContain('design-tokens')
    expect(concerns).toContain('naming-conventions')
    expect(concerns).toContain('import-hygiene')
    expect(concerns).toContain('financial-arithmetic')
    expect(concerns).toContain('design-system')
    expect(concerns).toContain('mobile-responsive')
  })

  it('rule IDs follow prefix convention', () => {
    for (const rule of parsedRules) {
      expect(rule.id).toMatch(/^[A-Z]-[A-Z]+-\d+$/)
    }
  })

  describe('agent rule distribution', () => {
    const byAgent = new Map<string, number>()
    for (const rule of parsedRules) {
      byAgent.set(rule.agent, (byAgent.get(rule.agent) ?? 0) + 1)
    }

    it('build-reviewer owns the most rules', () => {
      expect(byAgent.get('build-reviewer')).toBeGreaterThanOrEqual(25)
    })

    it('finance-sme owns at least 5 rules', () => {
      expect(byAgent.get('finance-sme')).toBeGreaterThanOrEqual(5)
    })

    it('design-auditor owns at least 10 rules', () => {
      expect(byAgent.get('design-auditor')).toBeGreaterThanOrEqual(10)
    })
  })
})

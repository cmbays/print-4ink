import picomatch from 'picomatch'
import { loadDomainMappings } from './load-config'
import type { PRFacts, PRClassification, PRType, PRScope } from '@domain/entities/review-pipeline'
import type { ReviewRiskLevel } from '@domain/entities/review-config'

// ---------------------------------------------------------------------------
// Domain severity weights — used for risk scoring
// ---------------------------------------------------------------------------

const DOMAIN_SEVERITY_WEIGHTS: Record<string, number> = {
  financial: 30,
  'dtf-optimization': 25,
  schemas: 20,
  infrastructure: 15,
  'ui-components': 10,
  'design-system': 10,
  'data-layer': 10,
  testing: 5,
  documentation: 5,
}

const DEFAULT_DOMAIN_WEIGHT = 10

// ---------------------------------------------------------------------------
// Commit prefix → PR type mapping
// ---------------------------------------------------------------------------

const PREFIX_TO_TYPE: Record<string, PRType> = {
  feat: 'feature',
  fix: 'bugfix',
  refactor: 'refactor',
  docs: 'docs',
  test: 'test',
  chore: 'chore',
}

// ---------------------------------------------------------------------------
// classify — Stage 2 of the review pipeline
//
// Consumes PRFacts (Stage 1 output), produces PRClassification.
// Deterministic: no LLM calls, no network, no randomness.
// ---------------------------------------------------------------------------

export function classify(facts: PRFacts): PRClassification {
  const domainMappings = loadDomainMappings()

  // 1. Match each changed file against domain patterns → collect unique domains
  const domains = collectDomains(facts, domainMappings)

  // 2. Infer scope from total lines changed
  const linesChanged = facts.totalAdditions + facts.totalDeletions
  const scope = inferScope(linesChanged)

  // 3. Compute risk score (0-100) from 3 components
  const filesChanged = facts.files.length
  const riskScore = computeRiskScore(linesChanged, domains, filesChanged)

  // 4. Derive risk level from score
  const riskLevel = deriveRiskLevel(riskScore)

  // 5. Infer PR type from commit message prefixes
  const type = inferPRType(facts.commits)

  return {
    type,
    riskLevel,
    riskScore,
    domains,
    scope,
    filesChanged,
    linesChanged,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function collectDomains(
  facts: PRFacts,
  mappings: readonly { pattern: string; domain: string }[]
): string[] {
  const domainSet = new Set<string>()

  for (const file of facts.files) {
    for (const mapping of mappings) {
      if (picomatch.isMatch(file.path, mapping.pattern)) {
        domainSet.add(mapping.domain)
      }
    }
  }

  return Array.from(domainSet)
}

function inferScope(linesChanged: number): PRScope {
  if (linesChanged < 100) return 'small'
  if (linesChanged <= 500) return 'medium'
  return 'large'
}

function computeRiskScore(linesChanged: number, domains: string[], filesChanged: number): number {
  // Line-count component (0-40 pts)
  const lineScore = Math.min(40, Math.round(Math.log2(linesChanged + 1) * 4))

  // Domain severity component (0-40 pts)
  let domainScore = 0
  for (const domain of domains) {
    domainScore += DOMAIN_SEVERITY_WEIGHTS[domain] ?? DEFAULT_DOMAIN_WEIGHT
  }
  domainScore = Math.min(40, domainScore)

  // File spread component (0-20 pts)
  const spreadScore = Math.min(20, filesChanged * 2)

  return Math.min(100, lineScore + domainScore + spreadScore)
}

function deriveRiskLevel(score: number): ReviewRiskLevel {
  if (score >= 75) return 'critical'
  if (score >= 50) return 'high'
  if (score >= 25) return 'medium'
  return 'low'
}

function inferPRType(commits: PRFacts['commits']): PRType {
  const types = new Set<PRType>()

  for (const commit of commits) {
    const match = commit.message.match(/^(\w+)(?:\(.+?\))?:/)
    if (match) {
      const prefix = match[1].toLowerCase()
      const mapped = PREFIX_TO_TYPE[prefix]
      if (mapped) {
        types.add(mapped)
      }
    }
  }

  if (types.size === 0) return 'chore'
  if (types.size === 1) return types.values().next().value!
  return 'mixed'
}

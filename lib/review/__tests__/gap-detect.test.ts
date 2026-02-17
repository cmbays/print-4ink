import { describe, it, expect } from 'vitest'
import {
  agentManifestEntrySchema,
  gapLogEntrySchema,
  type PRFacts,
  type PRClassification,
  type AgentManifestEntry,
} from '@domain/entities/review-pipeline'
import { z } from 'zod'
import {
  gapDetect,
  type GapAnalyzer,
  type GapAnalysisResult,
  type GapDetectResult,
} from '../gap-detect'

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const baseFacts: PRFacts = {
  branch: 'session/0216-test',
  baseBranch: 'main',
  files: [
    {
      path: 'lib/helpers/money.ts',
      additions: 10,
      deletions: 2,
      status: 'modified',
    },
  ],
  totalAdditions: 10,
  totalDeletions: 2,
  commits: [{ sha: 'abc123', message: 'feat: update money helper', author: 'Claude' }],
}

const baseClassification: PRClassification = {
  type: 'feature',
  riskLevel: 'medium',
  riskScore: 40,
  domains: ['financial'],
  scope: 'small',
  filesChanged: 1,
  linesChanged: 12,
}

const baseManifest: AgentManifestEntry[] = [
  {
    agentId: 'build-reviewer',
    scope: ['lib/helpers/money.ts'],
    priority: 50,
    rules: ['U-DRY-1'],
    reason: 'Universal code quality',
    triggeredBy: 'universal-build-reviewer',
  },
  {
    agentId: 'finance-sme',
    scope: ['lib/helpers/money.ts'],
    priority: 80,
    rules: ['D-FIN-1', 'D-FIN-2'],
    reason: 'Financial domain',
    triggeredBy: 'financial-domain-reviewer',
  },
]

// ---------------------------------------------------------------------------
// Schema for validating GapDetectResult shape
// ---------------------------------------------------------------------------

const gapDetectResultSchema = z.object({
  manifest: z.array(agentManifestEntrySchema),
  gaps: z.array(gapLogEntrySchema),
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('gapDetect (Stage 4 — Gap Detect)', () => {
  // -------------------------------------------------------------------------
  // 1. Passthrough when no analyzer is provided
  // -------------------------------------------------------------------------
  it('passes through manifest unchanged when no analyzer is provided', async () => {
    const result = await gapDetect(baseFacts, baseClassification, baseManifest)

    // Validate output shape against Zod schema
    const parsed = gapDetectResultSchema.parse(result)

    expect(parsed.manifest).toEqual(baseManifest)
    expect(parsed.gaps).toEqual([])
    expect(parsed.manifest).toHaveLength(2)
  })

  // -------------------------------------------------------------------------
  // 2. Passthrough when analyzer returns no gaps and no additional agents
  // -------------------------------------------------------------------------
  it('passes through when analyzer returns no gaps', async () => {
    const emptyAnalyzer: GapAnalyzer = async () => ({
      additionalAgents: [],
      gaps: [],
    })

    const result = await gapDetect(baseFacts, baseClassification, baseManifest, emptyAnalyzer)

    const parsed = gapDetectResultSchema.parse(result)

    expect(parsed.manifest).toEqual(baseManifest)
    expect(parsed.gaps).toEqual([])
  })

  // -------------------------------------------------------------------------
  // 3. Amends manifest when analyzer returns additional agents
  // -------------------------------------------------------------------------
  it('amends manifest when analyzer returns additional agents', async () => {
    const newAgent: AgentManifestEntry = {
      agentId: 'security-reviewer',
      scope: ['lib/helpers/money.ts'],
      priority: 90,
      rules: ['S-SEC-1'],
      reason: 'Security concern detected by gap analysis',
      triggeredBy: 'gap-detect',
    }

    const gapEntry = {
      concern: 'Financial helper changes may expose injection vectors',
      recommendation: 'Add security reviewer to check input sanitization',
      suggestedAgent: 'security-reviewer',
      confidence: 0.85,
    }

    const analyzer: GapAnalyzer = async () => ({
      additionalAgents: [newAgent],
      gaps: [gapEntry],
    })

    const result = await gapDetect(baseFacts, baseClassification, baseManifest, analyzer)

    const parsed = gapDetectResultSchema.parse(result)

    // New agent should be appended
    expect(parsed.manifest).toHaveLength(3)
    const securityAgent = parsed.manifest.find((a) => a.agentId === 'security-reviewer')
    expect(securityAgent).toBeDefined()
    expect(securityAgent!.priority).toBe(90)
    expect(securityAgent!.rules).toEqual(['S-SEC-1'])
    expect(securityAgent!.triggeredBy).toBe('gap-detect')

    // Gaps should be logged
    expect(parsed.gaps).toHaveLength(1)
    expect(parsed.gaps[0].concern).toBe('Financial helper changes may expose injection vectors')
    expect(parsed.gaps[0].suggestedAgent).toBe('security-reviewer')

    // Original agents should still be present
    expect(parsed.manifest.find((a) => a.agentId === 'build-reviewer')).toBeDefined()
    expect(parsed.manifest.find((a) => a.agentId === 'finance-sme')).toBeDefined()
  })

  // -------------------------------------------------------------------------
  // 4. Does not duplicate agents already in manifest — merges instead
  // -------------------------------------------------------------------------
  it('does not duplicate agents already in manifest — merges scope, rules, and priority', async () => {
    const overlappingAgent: AgentManifestEntry = {
      agentId: 'finance-sme',
      scope: ['lib/helpers/tax.ts'],
      priority: 95,
      rules: ['D-FIN-3'],
      reason: 'Gap analysis found tax calculation concern',
      triggeredBy: 'gap-detect',
    }

    const analyzer: GapAnalyzer = async () => ({
      additionalAgents: [overlappingAgent],
      gaps: [
        {
          concern: 'Tax calculation logic needs additional review coverage',
          recommendation: 'Extend finance-sme scope to include tax helpers',
          suggestedAgent: 'finance-sme',
          confidence: 0.9,
        },
      ],
    })

    const result = await gapDetect(baseFacts, baseClassification, baseManifest, analyzer)

    const parsed = gapDetectResultSchema.parse(result)

    // Should NOT duplicate — still 2 agents
    expect(parsed.manifest).toHaveLength(2)

    const merged = parsed.manifest.find((a) => a.agentId === 'finance-sme')
    expect(merged).toBeDefined()

    // Scope should be the union of both
    expect(merged!.scope).toContain('lib/helpers/money.ts')
    expect(merged!.scope).toContain('lib/helpers/tax.ts')
    expect(merged!.scope).toHaveLength(2)

    // Rules should be the union of both
    expect(merged!.rules).toContain('D-FIN-1')
    expect(merged!.rules).toContain('D-FIN-2')
    expect(merged!.rules).toContain('D-FIN-3')
    expect(merged!.rules).toHaveLength(3)

    // Priority should be the max of both (95 > 80)
    expect(merged!.priority).toBe(95)

    // Reason should have the gap analysis reason appended
    expect(merged!.reason).toContain('Financial domain')
    expect(merged!.reason).toContain('Gap analysis found tax calculation concern')

    // Gaps should still be logged
    expect(parsed.gaps).toHaveLength(1)
  })
})

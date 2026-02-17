// ── KB page data (embedded via script tag) ──────────────────────

export type KBPageData = {
  pipelineStageMap: Record<string, string[]>
  pipelineLabels: Record<string, string>
}

declare global {
  interface Window {
    __KB_DATA__: KBPageData
  }
}

// ── Gary Tracker ────────────────────────────────────────────────

export type GaryQuestionData = {
  questionId: string
  pipeline: string
  status: 'unanswered' | 'answered'
  questionText: string
  context: string
  answer?: string
  answeredDate?: string
  sourceFile: string
}

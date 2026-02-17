import { z } from 'zod'
import { configEntryBase } from './base'
import rawStages from '../stages.json'

const validStageSlugs = rawStages.map((s) => s.slug) as [string, ...string[]]

const pipelineTypeEntry = configEntryBase.extend({
  stages: z.array(z.enum(validStageSlugs)).nonempty(),
})

export const pipelineTypesConfigSchema = z.array(pipelineTypeEntry).nonempty()
export type PipelineTypeEntry = z.infer<typeof pipelineTypeEntry>

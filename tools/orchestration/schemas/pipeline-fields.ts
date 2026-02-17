import { z } from 'zod'

const fieldValidation = z
  .object({
    source: z.string().min(1).optional(),
    match: z.enum(['slug']).optional(),
    type: z.enum(['github-issue']).optional(),
  })
  .optional()

const fieldDisplay = z.object({
  section: z.enum(['title', 'header', 'config', 'timeline', 'assets']),
  label: z.string().min(1),
  order: z.number().int().positive(),
  format: z
    .enum(['raw', 'yes-no', 'csv', 'iso-date', 'issue', 'count-list', 'kv-list', 'kv-list-issue'])
    .default('raw'),
  emptyText: z.string().optional(),
})

const pipelineFieldEntry = z
  .object({
    jsonType: z.enum(['string', 'number', 'boolean', 'array', 'object']),
    description: z.string().min(1),
    updatable: z.boolean(),
    required: z.boolean(),
    default: z.unknown().optional(),
    flag: z
      .string()
      .regex(/^--[a-z][a-z0-9-]*$/)
      .optional(),
    negateFlag: z
      .string()
      .regex(/^--no-[a-z][a-z0-9-]*$/)
      .optional(),
    inputFormat: z.enum(['csv']).optional(),
    validate: fieldValidation,
    display: fieldDisplay,
  })
  .refine((f) => !f.updatable || f.flag !== undefined, {
    message: 'Updatable fields must have a flag',
  })
  .refine((f) => f.updatable || f.flag === undefined, {
    message: 'Non-updatable fields must not have a flag',
  })
  .refine((f) => f.jsonType !== 'boolean' || !f.flag || f.negateFlag !== undefined, {
    message: 'Boolean fields with flag must have negateFlag',
  })
  .refine((f) => f.jsonType === 'boolean' || f.negateFlag === undefined, {
    message: 'Non-boolean fields must not have negateFlag',
  })

export const pipelineFieldsConfigSchema = z.record(z.string(), pipelineFieldEntry)

export type FieldDisplay = z.infer<typeof fieldDisplay>
export type PipelineFieldEntry = z.infer<typeof pipelineFieldEntry>
export type PipelineFieldsConfig = z.infer<typeof pipelineFieldsConfigSchema>

import { z } from 'zod'
import { customerTypeTagEnum } from './customer'

// ---------------------------------------------------------------------------
// Tag → Template Mapping
// Maps customer type tags to pricing templates per service type.
// When quoting a customer with tag "sports-school", auto-apply their mapped template.
// ---------------------------------------------------------------------------

export const serviceTypeForMappingEnum = z.enum(['screen-print', 'dtf'])

export const tagTemplateMappingSchema = z.object({
  customerTypeTag: customerTypeTagEnum,
  screenPrintTemplateId: z.string().uuid().nullable(), // null = use default
  dtfTemplateId: z.string().uuid().nullable(), // null = use default
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServiceTypeForMapping = z.infer<typeof serviceTypeForMappingEnum>
export type TagTemplateMapping = z.infer<typeof tagTemplateMappingSchema>

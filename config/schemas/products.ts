import { z } from 'zod'
import { configEntryBase } from './base'

const productEntry = configEntryBase.extend({
  route: z.string().regex(/^\/[a-z0-9\-\/]*$/),
  icon: z.string().regex(/^[A-Z][a-zA-Z0-9]+$/),
})

export const productsConfigSchema = z.array(productEntry).nonempty()
export type ProductEntry = z.infer<typeof productEntry>

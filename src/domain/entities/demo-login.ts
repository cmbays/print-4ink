import { z } from 'zod'

export const demoLoginSchema = z.object({
  code: z.string().min(1, 'Access code is required'),
})

export type DemoLoginRequest = z.infer<typeof demoLoginSchema>

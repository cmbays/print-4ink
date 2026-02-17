import { z } from "zod";
import { configEntryBase } from "./base";

const toolEntry = configEntryBase.extend({
  icon: z.string().regex(/^[A-Z][a-zA-Z0-9]+$/),
});

export const toolsConfigSchema = z.array(toolEntry).nonempty();
export type ToolEntry = z.infer<typeof toolEntry>;

import { z } from "zod";
import { configEntryBase } from "./base";

const stageEntry = configEntryBase.extend({
  core: z.boolean().optional(),
  pipeline: z.boolean().optional(),
});

export const stagesConfigSchema = z.array(stageEntry).nonempty();
export type StageEntry = z.infer<typeof stageEntry>;

import { z } from "zod";
import { garmentSchema } from "./garment";

export const productionStateEnum = z.enum([
  "design",
  "approval",
  "burning",
  "press",
  "finishing",
  "shipped",
]);

export const priorityEnum = z.enum(["low", "medium", "high", "rush"]);

export const printLocationSchema = z.object({
  position: z.string().min(1),
  colorCount: z.number().int().positive(),
  artworkApproved: z.boolean(),
});

export const jobSchema = z.object({
  id: z.string().uuid(),
  jobNumber: z.string().min(1),
  title: z.string().min(1),
  customerId: z.string().uuid(),
  status: productionStateEnum,
  priority: priorityEnum,
  dueDate: z.string().date(),
  garments: z.array(garmentSchema),
  printLocations: z.array(printLocationSchema),
});

export type ProductionState = z.infer<typeof productionStateEnum>;
export type Priority = z.infer<typeof priorityEnum>;
export type PrintLocation = z.infer<typeof printLocationSchema>;
export type Job = z.infer<typeof jobSchema>;

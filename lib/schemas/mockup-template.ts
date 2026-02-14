import { z } from "zod";
import { garmentCategoryEnum } from "./garment";

export const mockupViewEnum = z.enum([
  "front",
  "back",
  "left-sleeve",
  "right-sleeve",
]);

export const printZoneSchema = z.object({
  position: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
});

export const mockupTemplateSchema = z.object({
  id: z.string().uuid(),
  garmentCategory: garmentCategoryEnum,
  view: mockupViewEnum,
  svgPath: z.string().min(1),
  printZones: z.array(printZoneSchema),
  viewBoxWidth: z.number().positive(),
  viewBoxHeight: z.number().positive(),
});

export type MockupView = z.infer<typeof mockupViewEnum>;
export type PrintZone = z.infer<typeof printZoneSchema>;
export type MockupTemplate = z.infer<typeof mockupTemplateSchema>;

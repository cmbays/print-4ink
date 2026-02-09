import type { ProductionState, Priority } from "./schemas/job";
import type { BurnStatus } from "./schemas/screen";
import type { QuoteStatus, ServiceType } from "./schemas/quote";
import type { CustomerTag } from "./schemas/customer";
import type { ArtworkTag } from "./schemas/artwork";
import type { GarmentCategory } from "./schemas/garment";

export const PRODUCTION_STATE_LABELS: Record<ProductionState, string> = {
  design: "Design",
  approval: "Approval",
  burning: "Burning",
  press: "Press",
  finishing: "Finishing",
  shipped: "Shipped",
};

export const PRODUCTION_STATE_COLORS: Record<ProductionState, string> = {
  design: "text-muted-foreground",
  approval: "text-warning",
  burning: "text-action",
  press: "text-action",
  finishing: "text-success",
  shipped: "text-success",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  rush: "Rush",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "text-muted-foreground",
  medium: "text-foreground",
  high: "text-warning",
  rush: "text-error",
};

export const BURN_STATUS_LABELS: Record<BurnStatus, string> = {
  pending: "Pending",
  burned: "Burned",
  reclaimed: "Reclaimed",
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  revised: "Revised",
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: "text-muted-foreground",
  sent: "text-action",
  accepted: "text-success",
  declined: "text-error",
  revised: "text-warning",
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  "screen-print": "Screen Print",
  dtf: "DTF",
  embroidery: "Embroidery",
};

export const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  "screen-print": "text-action",
  dtf: "text-warning",
  embroidery: "text-success",
};

export const CUSTOMER_TAG_LABELS: Record<CustomerTag, string> = {
  new: "New",
  repeat: "Repeat",
  contract: "Contract",
};

export const CUSTOMER_TAG_COLORS: Record<CustomerTag, string> = {
  new: "text-action",
  repeat: "text-success",
  contract: "text-warning",
};

export const GARMENT_CATEGORY_LABELS: Record<GarmentCategory, string> = {
  "t-shirts": "T-Shirts",
  fleece: "Hoodies & Fleece",
  outerwear: "Jackets",
  pants: "Pants",
  headwear: "Headwear",
};

export const ARTWORK_TAG_LABELS: Record<ArtworkTag, string> = {
  corporate: "Corporate",
  event: "Event",
  seasonal: "Seasonal",
  promotional: "Promotional",
  sports: "Sports",
  custom: "Custom",
};

import type { ProductionState, Priority } from "./schemas/job";
import type { BurnStatus } from "./schemas/screen";
import type { QuoteStatus } from "./schemas/quote";

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

import { money, round2, toNumber } from "@/lib/helpers/money";
import { DEPOSIT_DEFAULTS_BY_TIER } from "@/lib/constants";
import type { InvoiceStatus } from "@domain/entities/invoice";
import type { Quote } from "@domain/entities/quote";
import type { PricingTier } from "@domain/entities/customer";
import type { InvoiceLineItem } from "@domain/entities/invoice";

// ---------------------------------------------------------------------------
// Status state machine
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["sent", "void"],
  sent: ["partial", "paid", "void"],
  partial: ["paid", "void"],
  paid: [],
  void: [],
};

export function isValidStatusTransition(
  current: InvoiceStatus,
  target: InvoiceStatus,
): boolean {
  return VALID_TRANSITIONS[current].includes(target);
}

// ---------------------------------------------------------------------------
// Date parsing — "YYYY-MM-DD" must parse as local, not UTC
// ---------------------------------------------------------------------------

function parseDateLocal(dateString: string): Date {
  const [datePart] = dateString.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// ---------------------------------------------------------------------------
// Overdue computation (always computed at render time, never stored)
// ---------------------------------------------------------------------------

export function computeIsOverdue(invoice: {
  dueDate: string;
  balanceDue: number;
  status: InvoiceStatus;
}): boolean {
  if (invoice.balanceDue <= 0) return false;
  if (invoice.status !== "sent" && invoice.status !== "partial") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseDateLocal(invoice.dueDate);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

export function computeDaysOverdue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseDateLocal(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// Financial calculations — arbitrary-precision via big.js
// ---------------------------------------------------------------------------

export function calculateInvoiceTotal(
  lineItems: { lineTotal: number }[],
  discounts: { amount: number }[],
  shipping: number,
  taxRate: number,
): {
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
} {
  let subtotal = money(0);
  for (const item of lineItems) {
    subtotal = subtotal.plus(money(item.lineTotal));
  }

  let discountTotal = money(0);
  for (const d of discounts) {
    discountTotal = discountTotal.plus(money(d.amount));
  }

  // Shipping IS taxable in Indiana (included in taxable base)
  const taxableAmount = subtotal.minus(discountTotal).plus(money(shipping));
  const taxAmount = round2(taxableAmount.times(money(taxRate)).div(100));
  const total = round2(taxableAmount.plus(taxAmount));

  return {
    subtotal: toNumber(round2(subtotal)),
    discountTotal: toNumber(round2(discountTotal)),
    taxableAmount: toNumber(round2(taxableAmount)),
    taxAmount: toNumber(taxAmount),
    total: toNumber(total),
  };
}

// ---------------------------------------------------------------------------
// Smart deposit defaults
// ---------------------------------------------------------------------------

export function calculateSmartDeposit(
  pricingTier: PricingTier,
  total: number,
  overridePercent?: number,
): number {
  const percent = overridePercent ?? DEPOSIT_DEFAULTS_BY_TIER[pricingTier];
  return toNumber(round2(money(total).times(percent).div(100)));
}

// ---------------------------------------------------------------------------
// Due date calculation
// ---------------------------------------------------------------------------

export function calculateDueDate(
  createdAt: string,
  paymentTerms: string,
): string {
  // Parse date parts to avoid UTC timezone offset issues
  const [datePart] = createdAt.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  switch (paymentTerms) {
    case "cod":
    case "upfront":
      // Due immediately
      break;
    case "net-15":
      date.setDate(date.getDate() + 15);
      break;
    case "net-30":
      date.setDate(date.getDate() + 30);
      break;
    case "net-60":
      date.setDate(date.getDate() + 60);
      break;
    default:
      // Default to due on creation
      break;
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Quote → Invoice line item conversion
// ---------------------------------------------------------------------------

export function convertQuoteToInvoiceLineItems(
  quote: Quote,
): Omit<InvoiceLineItem, "id">[] {
  const items: Omit<InvoiceLineItem, "id">[] = [];

  for (const lineItem of quote.lineItems) {
    const totalQty = Object.values(lineItem.sizes).reduce(
      (sum, qty) => sum + qty,
      0,
    );

    items.push({
      type: "garment",
      description: `${lineItem.garmentId} — ${lineItem.colorId} (${totalQty} pcs)`,
      quantity: totalQty,
      unitPrice: lineItem.unitPrice,
      lineTotal: lineItem.lineTotal,
    });
  }

  if (quote.setupFees > 0) {
    items.push({
      type: "setup",
      description: "Setup fees",
      quantity: 1,
      unitPrice: quote.setupFees,
      lineTotal: quote.setupFees,
    });
  }

  return items;
}

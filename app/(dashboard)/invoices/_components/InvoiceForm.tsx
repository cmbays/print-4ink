"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Save,
  Send,
  StickyNote,
  User,
  DollarSign,
  FileText,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CustomerCombobox,
  type CustomerOption,
} from "@/components/features/CustomerCombobox";
import { CollapsibleSection } from "@/app/(dashboard)/quotes/_components/CollapsibleSection";
import { InvoiceLineItemRow, type InvoiceLineItemData } from "./InvoiceLineItemRow";
import { InvoicePricingSummary } from "./InvoicePricingSummary";
import { DepositSection } from "./DepositSection";
import { PaymentTermsSection } from "./PaymentTermsSection";
import { ReviewSendSheet } from "./ReviewSendSheet";
import {
  customers as mockCustomers,
  quotes as mockQuotes,
  invoices as mockInvoices,
} from "@/lib/mock-data";
import { PAYMENT_TERMS_LABELS } from "@/lib/constants";
import {
  calculateInvoiceTotal,
  calculateDueDate,
  convertQuoteToInvoiceLineItems,
} from "@/lib/helpers/invoice-utils";
import { money, round2, toNumber } from "@/lib/helpers/money";
import type { PaymentTerms, PricingTier } from "@/lib/schemas/customer";
import type { Invoice } from "@/lib/schemas/invoice";

const DEFAULT_TAX_RATE = 7; // Indiana state tax

interface InvoiceFormProps {
  mode: "create" | "edit";
  initialData?: Invoice;
  quoteId?: string;
}

function createEmptyLineItem(): InvoiceLineItemData {
  return {
    id: crypto.randomUUID(),
    type: "garment",
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function generateInvoiceNumber(): string {
  const nextNum = mockInvoices.length + 1;
  return `INV-${String(nextNum).padStart(4, "0")}`;
}

export function InvoiceForm({ mode, initialData, quoteId }: InvoiceFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  // Resolve source quote if present
  const sourceQuote = useMemo(() => {
    const qId = quoteId || initialData?.quoteId;
    if (!qId) return null;
    return mockQuotes.find((q) => q.id === qId) ?? null;
  }, [quoteId, initialData?.quoteId]);

  // Pre-populate line items from quote
  const initialLineItems = useMemo((): InvoiceLineItemData[] => {
    if (initialData?.lineItems) {
      return initialData.lineItems.map((li) => ({
        id: li.id,
        type: li.type,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
      }));
    }
    if (sourceQuote) {
      return convertQuoteToInvoiceLineItems(sourceQuote).map((li) => ({
        id: crypto.randomUUID(),
        ...li,
      }));
    }
    return [createEmptyLineItem()];
  }, [initialData, sourceQuote]);

  // Customer state
  const customerOptions: CustomerOption[] = useMemo(
    () =>
      mockCustomers.map((c) => {
        const primaryContact = c.contacts.find((ct) => ct.isPrimary);
        return {
          id: c.id,
          name: c.name,
          company: c.company,
          email: c.email,
          phone: c.phone,
          tag: c.tag,
          lifecycleStage: c.lifecycleStage,
          typeTags: c.typeTags,
          contactRole: primaryContact?.role,
        };
      }),
    []
  );

  const initialCustomerId =
    initialData?.customerId || sourceQuote?.customerId || "";

  const [customerId, setCustomerId] = useState(initialCustomerId);
  const selectedCustomer = mockCustomers.find((c) => c.id === customerId);

  // Line items
  const [lineItems, setLineItems] =
    useState<InvoiceLineItemData[]>(initialLineItems);

  // Pricing inputs
  const [shipping, setShipping] = useState(initialData?.shipping ?? 0);
  const [taxRate, setTaxRate] = useState(
    initialData?.taxRate ?? (selectedCustomer?.taxExempt ? 0 : DEFAULT_TAX_RATE)
  );

  // Payment terms
  const createdAt = initialData?.createdAt ?? new Date().toISOString();
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(
    (initialData?.paymentTerms as PaymentTerms) ??
      selectedCustomer?.paymentTerms ??
      "upfront"
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate ?? calculateDueDate(createdAt, paymentTerms)
  );

  // Deposit
  const customerTier: PricingTier = selectedCustomer?.pricingTier ?? "standard";
  const [depositAmount, setDepositAmount] = useState(
    initialData?.depositRequested ?? 0
  );

  // Notes
  const [internalNotes, setInternalNotes] = useState(
    initialData?.internalNotes ?? ""
  );
  const [customerNotes, setCustomerNotes] = useState(
    initialData?.customerNotes ?? ""
  );

  // Review sheet
  const [showReview, setShowReview] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Invoice number
  const invoiceNumber = initialData?.invoiceNumber ?? generateInvoiceNumber();

  // Computed pricing
  const pricing = useMemo(() => {
    const items = lineItems.map((li) => ({
      lineTotal: toNumber(round2(money(li.quantity).times(li.unitPrice))),
    }));
    return calculateInvoiceTotal(items, [], shipping, taxRate);
  }, [lineItems, shipping, taxRate]);

  // Handlers
  const handleLineItemChange = useCallback(
    (index: number, item: InvoiceLineItemData) => {
      setLineItems((prev) => {
        const next = [...prev];
        next[index] = item;
        return next;
      });
    },
    []
  );

  const handleLineItemRemove = useCallback((index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, createEmptyLineItem()]);
  }, []);

  const handleCustomerSelect = useCallback(
    (id: string) => {
      setCustomerId(id);
      const customer = mockCustomers.find((c) => c.id === id);
      if (customer) {
        // Auto-set payment terms from customer
        setPaymentTerms(customer.paymentTerms);
        setDueDate(calculateDueDate(createdAt, customer.paymentTerms));
        // Tax-exempt guard
        if (customer.taxExempt) {
          setTaxRate(0);
        } else {
          setTaxRate(DEFAULT_TAX_RATE);
        }
      }
      if (errors.customerId) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.customerId;
          return next;
        });
      }
    },
    [createdAt, errors.customerId]
  );

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!customerId) {
      nextErrors.customerId = "Customer is required";
    }
    if (lineItems.length === 0) {
      nextErrors.lineItems = "At least one line item is required";
    }
    const hasEmptyDescription = lineItems.some(
      (li) => !li.description.trim()
    );
    if (hasEmptyDescription) {
      nextErrors.lineItems = "All line items need a description";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSaveDraft() {
    if (!validate()) return;
    toast.success(isEdit ? "Invoice updated" : "Invoice saved as draft", {
      description: isEdit
        ? `${invoiceNumber} has been updated.`
        : "You can continue editing this invoice later.",
    });
    router.push("/invoices");
  }

  function handleReviewAndSend() {
    if (!validate()) return;
    setShowReview(true);
  }

  function handleSendFromReview() {
    // Mock: set status to sent
    router.push("/invoices");
  }

  // Summaries for collapsed sections
  const customerSummary = selectedCustomer
    ? `${selectedCustomer.name} — ${selectedCustomer.company}`
    : undefined;

  const lineItemSummary =
    lineItems.length > 0 && lineItems[0].description
      ? `${lineItems.length} item${lineItems.length !== 1 ? "s" : ""} — ${formatCurrency(pricing.subtotal)}`
      : undefined;

  const hasNotes = !!(internalNotes || customerNotes);
  const notesSummary = useMemo(() => {
    const parts: string[] = [];
    if (internalNotes) parts.push("Internal");
    if (customerNotes) parts.push("Customer");
    return parts.length > 0 ? parts.join(" + ") : undefined;
  }, [internalNotes, customerNotes]);

  return (
    <>
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {/* Sticky summary bar */}
        <div className="sticky top-0 z-20 -mx-1 rounded-lg border border-border bg-card/95 backdrop-blur-sm px-4 py-2 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileText size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground">
                {invoiceNumber}
              </span>
              {selectedCustomer && (
                <>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {selectedCustomer.company}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <p className="text-xs text-muted-foreground leading-none">
                  Total
                </p>
                <p className="text-sm font-semibold font-mono text-foreground leading-tight">
                  {formatCurrency(pricing.total)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Customer */}
        <CollapsibleSection
          title="Customer"
          icon={<User size={16} className="text-muted-foreground" />}
          summary={customerSummary}
          isComplete={!!customerId}
          defaultOpen={!customerId}
        >
          <div className="space-y-2 pt-2">
            <CustomerCombobox
              customers={customerOptions}
              selectedCustomerId={customerId || undefined}
              onSelect={handleCustomerSelect}
            />
            {errors.customerId && (
              <p className="text-xs text-error" role="alert">
                {errors.customerId}
              </p>
            )}
          </div>
        </CollapsibleSection>

        {/* Section 2: Source Quote */}
        {sourceQuote && (
          <CollapsibleSection
            title="Source Quote"
            icon={<FileText size={16} className="text-muted-foreground" />}
            summary={`${sourceQuote.quoteNumber} — ${formatCurrency(sourceQuote.total)}`}
            isComplete
            defaultOpen={false}
          >
            <div className="pt-2 rounded-md bg-surface px-3 py-2 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quote</span>
                <Link
                  href={`/quotes/${sourceQuote.id}`}
                  className="text-action hover:underline font-medium"
                >
                  {sourceQuote.quoteNumber}
                </Link>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quote Total</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(sourceQuote.total)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="text-foreground capitalize">
                  {sourceQuote.status}
                </span>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Section 3: Line Items */}
        <CollapsibleSection
          title="Line Items"
          icon={<ShoppingBag size={16} className="text-muted-foreground" />}
          summary={lineItemSummary}
          isComplete={lineItems.length > 0 && lineItems[0].description !== ""}
          defaultOpen
        >
          <div className="space-y-3 pt-2">
            {errors.lineItems && (
              <p className="text-xs text-error" role="alert">
                {errors.lineItems}
              </p>
            )}
            {lineItems.map((item, i) => (
              <InvoiceLineItemRow
                key={item.id}
                index={i}
                item={item}
                onChange={handleLineItemChange}
                onRemove={handleLineItemRemove}
                canRemove={lineItems.length > 1}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddLineItem}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Add Line Item
            </Button>
          </div>
        </CollapsibleSection>

        {/* Section 4: Pricing Summary */}
        <CollapsibleSection
          title="Pricing"
          icon={<DollarSign size={16} className="text-muted-foreground" />}
          defaultOpen
        >
          <div className="pt-2 space-y-4">
            {/* Editable inputs for shipping and tax rate */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="shipping"
                  className="text-xs text-muted-foreground"
                >
                  Shipping
                </Label>
                <Input
                  id="shipping"
                  type="number"
                  min={0}
                  step={0.01}
                  value={shipping || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setShipping(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="h-9 text-right text-sm font-mono"
                  placeholder="$0.00"
                  aria-label="Shipping cost"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="tax-rate"
                  className="text-xs text-muted-foreground"
                >
                  Tax Rate (%)
                </Label>
                <Input
                  id="tax-rate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={taxRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setTaxRate(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
                  }}
                  className="h-9 text-right text-sm font-mono"
                  aria-label="Tax rate"
                />
                {selectedCustomer?.taxExempt && (
                  <p className="text-xs text-success">Tax-exempt customer</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-elevated p-4">
              <InvoicePricingSummary
                subtotal={pricing.subtotal}
                discountTotal={pricing.discountTotal}
                shipping={shipping}
                taxRate={taxRate}
                taxAmount={pricing.taxAmount}
                total={pricing.total}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Section 5: Payment Terms & Deposit */}
        <CollapsibleSection
          title="Payment Terms & Deposit"
          icon={<CreditCard size={16} className="text-muted-foreground" />}
          summary={PAYMENT_TERMS_LABELS[paymentTerms]}
          defaultOpen
        >
          <div className="pt-2 space-y-4">
            <PaymentTermsSection
              paymentTerms={paymentTerms}
              dueDate={dueDate}
              createdAt={createdAt}
              onTermsChange={setPaymentTerms}
              onDueDateChange={setDueDate}
            />
            <DepositSection
              depositAmount={depositAmount}
              onDepositChange={setDepositAmount}
              total={pricing.total}
              customerTier={customerTier}
            />
          </div>
        </CollapsibleSection>

        {/* Section 6: Notes */}
        <CollapsibleSection
          title="Notes"
          icon={<StickyNote size={16} className="text-muted-foreground" />}
          summary={notesSummary}
          isComplete={hasNotes}
          defaultOpen={false}
        >
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="internal-notes"
                className="text-xs text-muted-foreground"
              >
                Internal Notes (not visible to customer)
              </Label>
              <Textarea
                id="internal-notes"
                placeholder="Add internal notes..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="customer-notes"
                className="text-xs text-muted-foreground"
              >
                Customer Notes (visible on invoice)
              </Label>
              <Textarea
                id="customer-notes"
                placeholder="Add notes for the customer..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button
            variant="link"
            onClick={() => router.push("/invoices")}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save size={16} className="mr-2" />
              {isEdit ? "Update Invoice" : "Save as Draft"}
            </Button>
            <Button
              onClick={handleReviewAndSend}
              className="bg-action text-primary-foreground font-medium shadow-[4px_4px_0px] shadow-action/30 hover:shadow-[2px_2px_0px] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Send size={16} className="mr-2" />
              Review & Send
            </Button>
          </div>
        </div>
      </div>

      {/* Review Sheet */}
      {showReview && selectedCustomer && (
        <ReviewSendSheet
          open={showReview}
          onOpenChange={setShowReview}
          invoiceNumber={invoiceNumber}
          customerName={selectedCustomer.name}
          customerCompany={selectedCustomer.company}
          customerEmail={selectedCustomer.email}
          lineItems={lineItems}
          subtotal={pricing.subtotal}
          discountTotal={pricing.discountTotal}
          shipping={shipping}
          taxRate={taxRate}
          taxAmount={pricing.taxAmount}
          total={pricing.total}
          depositAmount={depositAmount}
          dueDate={dueDate}
          paymentTerms={paymentTerms}
          onSend={handleSendFromReview}
        />
      )}
    </>
  );
}

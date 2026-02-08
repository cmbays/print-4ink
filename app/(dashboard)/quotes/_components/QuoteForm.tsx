"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Send, StickyNote, ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CustomerCombobox } from "@/components/features/CustomerCombobox";
import { AddCustomerModal } from "@/components/features/AddCustomerModal";
import { LineItemRow } from "./LineItemRow";
import { PricingSummary } from "./PricingSummary";
import {
  customers as mockCustomers,
  colors as mockColors,
  garmentCatalog,
} from "@/lib/mock-data";
import type { LineItemData } from "./LineItemRow";

interface QuoteFormProps {
  mode: "create" | "edit";
  initialData?: {
    customerId?: string;
    lineItems?: LineItemData[];
    setupFees?: number;
    priceOverride?: number;
    internalNotes?: string;
    customerNotes?: string;
  };
  quoteId?: string;
}

let lineItemCounter = 0;
function createEmptyLineItem(): LineItemData {
  lineItemCounter += 1;
  return {
    id: `li-${Date.now()}-${lineItemCounter}`,
    garmentId: "",
    colorId: "",
    sizes: {},
    printLocations: [],
    colorsPerLocation: 1,
  };
}

function calculateUnitPrice(
  garmentId: string,
  colorsPerLocation: number,
  locationCount: number
): number {
  const garment = garmentCatalog.find((g) => g.id === garmentId);
  if (!garment) return 0;
  return garment.basePrice + colorsPerLocation * 0.5 + locationCount * 0.25;
}

export function QuoteForm({ mode, initialData, quoteId }: QuoteFormProps) {
  const router = useRouter();

  // Customer state
  const [customers, setCustomers] = useState(
    mockCustomers.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      email: c.email,
    }))
  );
  const [customerId, setCustomerId] = useState(
    initialData?.customerId || ""
  );
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Line items
  const [lineItems, setLineItems] = useState<LineItemData[]>(
    initialData?.lineItems || [createEmptyLineItem()]
  );

  // Pricing
  const [setupFees, setSetupFees] = useState(initialData?.setupFees || 0);
  const [priceOverride, setPriceOverride] = useState<number | null>(
    initialData?.priceOverride ?? null
  );

  // Notes
  const [internalNotes, setInternalNotes] = useState(
    initialData?.internalNotes || ""
  );
  const [customerNotes, setCustomerNotes] = useState(
    initialData?.customerNotes || ""
  );

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lineItemErrors, setLineItemErrors] = useState<
    Record<number, Record<string, string>>
  >({});

  // Compute line totals for PricingSummary
  const lineItemTotals = useMemo(() => {
    return lineItems.map((item) => {
      const unitPrice = calculateUnitPrice(
        item.garmentId,
        item.colorsPerLocation,
        item.printLocations.length
      );
      const totalQty = Object.values(item.sizes).reduce(
        (sum, qty) => sum + qty,
        0
      );
      return { lineTotal: unitPrice * totalQty };
    });
  }, [lineItems]);

  // Handlers
  const handleLineItemChange = useCallback(
    (index: number, data: LineItemData) => {
      setLineItems((prev) => {
        const next = [...prev];
        next[index] = data;
        return next;
      });
      // Clear errors for this line item when changed
      setLineItemErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    },
    []
  );

  const handleLineItemRemove = useCallback((index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
    setLineItemErrors((prev) => {
      const next: Record<number, Record<string, string>> = {};
      // Re-index errors after removal
      Object.entries(prev).forEach(([key, val]) => {
        const k = parseInt(key, 10);
        if (k < index) next[k] = val;
        else if (k > index) next[k - 1] = val;
      });
      return next;
    });
  }, []);

  const handleAddLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, createEmptyLineItem()]);
  }, []);

  const handleAddNewCustomer = useCallback(
    (data: { name: string; email: string; company?: string }) => {
      const newCustomer = {
        id: `new-${Date.now()}`,
        name: data.name,
        email: data.email,
        company: data.company || "",
      };
      setCustomers((prev) => [...prev, newCustomer]);
      setCustomerId(newCustomer.id);
      if (errors.customerId) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.customerId;
          return next;
        });
      }
    },
    [errors.customerId]
  );

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    const nextLineErrors: Record<number, Record<string, string>> = {};

    if (!customerId) {
      nextErrors.customerId = "Customer is required";
    }

    if (lineItems.length === 0) {
      nextErrors.lineItems = "At least one line item is required";
    }

    lineItems.forEach((item, i) => {
      const itemErrors: Record<string, string> = {};
      if (!item.garmentId) {
        itemErrors.garmentId = "Garment is required";
      }
      const totalQty = Object.values(item.sizes).reduce(
        (sum, qty) => sum + qty,
        0
      );
      if (totalQty === 0) {
        itemErrors.sizes = "At least one size with qty > 0 is required";
      }
      if (Object.keys(itemErrors).length > 0) {
        nextLineErrors[i] = itemErrors;
      }
    });

    setErrors(nextErrors);
    setLineItemErrors(nextLineErrors);

    return (
      Object.keys(nextErrors).length === 0 &&
      Object.keys(nextLineErrors).length === 0
    );
  }

  const isEdit = mode === "edit";

  function handleSave(sendToCustomer: boolean) {
    if (!validate()) return;

    if (sendToCustomer) {
      toast.success("Quote sent to customer", {
        description: "The customer will receive an email with the quote.",
      });
    } else {
      toast.success(
        isEdit ? "Quote updated" : "Quote saved as draft",
        {
          description: isEdit
            ? `Quote ${quoteId ?? ""} has been updated.`
            : "You can continue editing this quote later.",
        }
      );
    }

    router.push("/quotes");
  }

  return (
    <>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Section 1: Customer */}
        <section className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Customer
          </Label>
          <CustomerCombobox
            customers={customers}
            selectedCustomerId={customerId || undefined}
            onSelect={(id) => {
              setCustomerId(id);
              if (errors.customerId) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.customerId;
                  return next;
                });
              }
            }}
            onAddNew={() => setShowAddCustomer(true)}
          />
          {errors.customerId && (
            <p className="text-xs text-error">{errors.customerId}</p>
          )}
        </section>

        {/* Section 2: Line Items */}
        <section className="space-y-4">
          <Label className="text-sm font-medium text-foreground">
            Line Items
          </Label>
          {errors.lineItems && (
            <p className="text-xs text-error">{errors.lineItems}</p>
          )}
          {lineItems.map((item, i) => (
            <LineItemRow
              key={item.id}
              index={i}
              data={item}
              onChange={handleLineItemChange}
              onRemove={handleLineItemRemove}
              canRemove={lineItems.length > 1}
              garmentCatalog={garmentCatalog}
              colors={mockColors}
              errors={lineItemErrors[i]}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddLineItem}
            className="w-full"
          >
            <Plus size={16} className="mr-2" />
            Add Another Line Item
          </Button>
        </section>

        {/* Section 3: Pricing Summary */}
        <section>
          <PricingSummary
            lineItems={lineItemTotals}
            setupFees={setupFees}
            onSetupFeesChange={setSetupFees}
            priceOverride={priceOverride}
            onPriceOverrideChange={setPriceOverride}
          />
        </section>

        {/* Section 4 & 5: Notes & Artwork (Accordions) */}
        <Accordion type="multiple" className="space-y-2">
          <AccordionItem
            value="notes"
            className="rounded-lg border border-border bg-elevated px-4"
          >
            <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
              <span className="flex items-center gap-2">
                <StickyNote size={16} className="text-muted-foreground" />
                Notes
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
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
                  Customer Notes (visible on quote)
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="artwork"
            className="rounded-lg border border-border bg-elevated px-4"
          >
            <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
              <span className="flex items-center gap-2">
                <ImageIcon size={16} className="text-muted-foreground" />
                Artwork
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="flex items-center justify-center rounded-md border border-dashed border-border bg-surface px-4 py-8">
                <p className="text-sm text-muted-foreground">
                  Artwork upload coming in Phase 2
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Section 6: Actions */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button
            variant="link"
            onClick={() => router.push("/quotes")}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
            >
              <Save size={16} className="mr-2" />
              {isEdit ? "Update Quote" : "Save as Draft"}
            </Button>
            <Button
              onClick={() => handleSave(true)}
              className="bg-action text-primary-foreground font-medium shadow-[4px_4px_0px] shadow-action/30 hover:shadow-[2px_2px_0px] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Send size={16} className="mr-2" />
              Save & Send to Customer
            </Button>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        onSave={handleAddNewCustomer}
      />
    </>
  );
}

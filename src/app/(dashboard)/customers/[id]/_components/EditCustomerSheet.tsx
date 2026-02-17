"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LIFECYCLE_STAGE_LABELS,
  CUSTOMER_TYPE_TAG_LABELS,
  PAYMENT_TERMS_LABELS,
  PRICING_TIER_LABELS,
} from "@/lib/constants";
import type { Customer, LifecycleStage, CustomerTypeTag, PaymentTerms, PricingTier } from "@domain/entities/customer";
import { lifecycleStageEnum, customerTypeTagEnum, paymentTermsEnum, pricingTierEnum } from "@domain/entities/customer";

interface EditCustomerSheetProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCustomerSheet({
  customer,
  open,
  onOpenChange,
}: EditCustomerSheetProps) {
  const [company, setCompany] = useState(customer.company);
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>(
    customer.lifecycleStage
  );
  const [typeTags, setTypeTags] = useState<CustomerTypeTag[]>(
    customer.typeTags
  );
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(
    customer.paymentTerms
  );
  const [pricingTier, setPricingTier] = useState<PricingTier>(
    customer.pricingTier
  );
  const [discountPercentage, setDiscountPercentage] = useState(
    customer.discountPercentage?.toString() ?? ""
  );
  const [taxExempt, setTaxExempt] = useState(customer.taxExempt);

  function handleToggleTypeTag(tag: CustomerTypeTag) {
    setTypeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSave() {
    // Phase 1: No actual save
    console.log("Changes saved", {
      company,
      lifecycleStage,
      typeTags,
      paymentTerms,
      pricingTier,
      discountPercentage: discountPercentage ? Number(discountPercentage) : undefined,
      taxExempt,
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit Customer</SheetTitle>
          <SheetDescription>
            Update customer information for {customer.company}.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 space-y-6">
          {/* Company Info */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Company Info
            </legend>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company Name</Label>
              <Input
                id="edit-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </fieldset>

          {/* Classification */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Classification
            </legend>
            <div className="space-y-2">
              <Label htmlFor="edit-lifecycle">Lifecycle Stage</Label>
              <Select
                value={lifecycleStage}
                onValueChange={(v) => setLifecycleStage(v as LifecycleStage)}
              >
                <SelectTrigger className="w-full" aria-label="Lifecycle stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lifecycleStageEnum.options.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {LIFECYCLE_STAGE_LABELS[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type Tags</Label>
              <div className="grid grid-cols-2 gap-2">
                {customerTypeTagEnum.options.map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={typeTags.includes(tag)}
                      onCheckedChange={() => handleToggleTypeTag(tag)}
                      aria-label={CUSTOMER_TYPE_TAG_LABELS[tag]}
                    />
                    {CUSTOMER_TYPE_TAG_LABELS[tag]}
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          {/* Financial */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Financial
            </legend>
            <div className="space-y-2">
              <Label htmlFor="edit-payment-terms">Payment Terms</Label>
              <Select
                value={paymentTerms}
                onValueChange={(v) => setPaymentTerms(v as PaymentTerms)}
              >
                <SelectTrigger className="w-full" aria-label="Payment terms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentTermsEnum.options.map((term) => (
                    <SelectItem key={term} value={term}>
                      {PAYMENT_TERMS_LABELS[term]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pricing-tier">Pricing Tier</Label>
              <Select
                value={pricingTier}
                onValueChange={(v) => setPricingTier(v as PricingTier)}
              >
                <SelectTrigger className="w-full" aria-label="Pricing tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pricingTierEnum.options.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {PRICING_TIER_LABELS[tier]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-discount">Discount %</Label>
              <Input
                id="edit-discount"
                type="number"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                placeholder="0"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={taxExempt}
                onCheckedChange={(checked) => setTaxExempt(checked === true)}
                aria-label="Tax exempt"
              />
              Tax Exempt
            </label>
          </fieldset>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

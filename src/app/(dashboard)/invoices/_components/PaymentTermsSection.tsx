"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_TERMS_LABELS } from "@/lib/constants";
import { calculateDueDate } from "@/lib/helpers/invoice-utils";
import type { PaymentTerms } from "@/lib/schemas/customer";

const PAYMENT_TERMS_OPTIONS: PaymentTerms[] = [
  "cod",
  "upfront",
  "net-15",
  "net-30",
  "net-60",
];

interface PaymentTermsSectionProps {
  paymentTerms: PaymentTerms;
  dueDate: string;
  createdAt: string;
  onTermsChange: (terms: PaymentTerms) => void;
  onDueDateChange: (date: string) => void;
}

export function PaymentTermsSection({
  paymentTerms,
  dueDate,
  createdAt,
  onTermsChange,
  onDueDateChange,
}: PaymentTermsSectionProps) {
  function handleTermsChange(terms: PaymentTerms) {
    onTermsChange(terms);
    const newDue = calculateDueDate(createdAt, terms);
    onDueDateChange(newDue);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* Payment Terms */}
        <div className="space-y-1.5">
          <Label htmlFor="payment-terms" className="text-xs text-muted-foreground">
            Payment Terms
          </Label>
          <Select
            value={paymentTerms}
            onValueChange={(value) =>
              handleTermsChange(value as PaymentTerms)
            }
          >
            <SelectTrigger id="payment-terms" className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TERMS_OPTIONS.map((term) => (
                <SelectItem key={term} value={term}>
                  {PAYMENT_TERMS_LABELS[term]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <Label htmlFor="due-date" className="text-xs text-muted-foreground">
            Due Date
          </Label>
          <Input
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="h-9 text-sm"
            aria-label="Invoice due date"
          />
        </div>
      </div>
    </div>
  );
}

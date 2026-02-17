"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CUSTOMER_TYPE_TAG_LABELS } from "@/lib/constants";
import type { CustomerTypeTag } from "@domain/entities/customer";

interface NewCustomerData {
  id: string;
  company: string;
  name: string;
  email?: string;
  phone?: string;
  typeTags: CustomerTypeTag[];
  lifecycleStage: "prospect" | "new";
}

export interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: NewCustomerData) => void;
  onSaveAndView?: (customer: NewCustomerData) => void;
  lifecycleStage?: "prospect" | "new";
}

const TYPE_TAG_OPTIONS: CustomerTypeTag[] = [
  "retail",
  "sports-school",
  "corporate",
  "storefront-merch",
  "wholesale",
];

export function AddCustomerModal({
  open,
  onOpenChange,
  onSave,
  onSaveAndView,
  lifecycleStage,
}: AddCustomerModalProps) {
  const [company, setCompany] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [typeTags, setTypeTags] = React.useState<CustomerTypeTag[]>([]);
  const [errors, setErrors] = React.useState<{
    company?: string;
    name?: string;
    contact?: string;
    email?: string;
  }>({});

  function reset() {
    setCompany("");
    setName("");
    setEmail("");
    setPhone("");
    setTypeTags([]);
    setErrors({});
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  }

  function toggleTypeTag(tag: CustomerTypeTag) {
    setTypeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function validate(): boolean {
    const next: { company?: string; name?: string; contact?: string; email?: string } = {};
    if (!company.trim()) {
      next.company = "Company is required";
    }
    if (!name.trim()) {
      next.name = "Contact name is required";
    }
    if (!email.trim() && !phone.trim()) {
      next.contact = "Email or phone is required";
    } else if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Invalid email format";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function getFormData(): NewCustomerData {
    return {
      id: crypto.randomUUID(),
      company: company.trim(),
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      typeTags,
      lifecycleStage: lifecycleStage ?? ("new" as const),
    };
  }

  function handleSave() {
    if (!validate()) return;
    onSave(getFormData());
    reset();
    onOpenChange(false);
  }

  function handleSaveAndView() {
    if (!validate()) return;
    onSaveAndView?.(getFormData());
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Create a new customer record.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Company (required, first) */}
          <div className="space-y-2">
            <Label htmlFor="customer-company">
              Company <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customer-company"
              placeholder="Company name"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                if (errors.company) setErrors((prev) => ({ ...prev, company: undefined }));
              }}
              aria-invalid={!!errors.company}
            />
            {errors.company && (
              <p className="text-sm text-destructive">{errors.company}</p>
            )}
          </div>

          {/* Contact Name (required) */}
          <div className="space-y-2">
            <Label htmlFor="customer-contact-name">
              Contact Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customer-contact-name"
              placeholder="Contact name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.contact) setErrors((prev) => ({ ...prev, contact: undefined }));
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              aria-invalid={!!errors.contact || !!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
            {errors.contact && !errors.email && (
              <p className="text-sm text-destructive">{errors.contact}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone</Label>
            <Input
              id="customer-phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.contact) setErrors((prev) => ({ ...prev, contact: undefined }));
              }}
              aria-invalid={!!errors.contact}
            />
            {!errors.contact && !email.trim() && !phone.trim() && (
              <p className="text-sm text-muted-foreground">
                At least one contact method (email or phone) is required.
              </p>
            )}
          </div>

          {/* Type Tags (multi-select pills) */}
          <div className="space-y-2">
            <Label>Customer Type</Label>
            <div className="flex flex-wrap gap-2">
              {TYPE_TAG_OPTIONS.map((tagOption) => {
                const isActive = typeTags.includes(tagOption);
                return (
                  <button
                    key={tagOption}
                    type="button"
                    onClick={() => toggleTypeTag(tagOption)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-action/10 text-action border border-action/20"
                        : "bg-muted text-muted-foreground border border-transparent hover:border-border"
                    )}
                  >
                    {CUSTOMER_TYPE_TAG_LABELS[tagOption]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          {onSaveAndView && (
            <Button variant="outline" onClick={handleSaveAndView}>
              Save & View Details
            </Button>
          )}
          <Button onClick={handleSave}>Save Customer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

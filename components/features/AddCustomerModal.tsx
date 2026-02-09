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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CUSTOMER_TAG_LABELS } from "@/lib/constants";
import type { CustomerTag } from "@/lib/schemas/customer";

export interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    tag?: CustomerTag;
  }) => void;
}

const TAG_OPTIONS: CustomerTag[] = ["new", "repeat", "contract"];

export function AddCustomerModal({
  open,
  onOpenChange,
  onSave,
}: AddCustomerModalProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [tag, setTag] = React.useState<CustomerTag>("new");
  const [errors, setErrors] = React.useState<{
    name?: string;
    email?: string;
  }>({});

  function reset() {
    setName("");
    setEmail("");
    setCompany("");
    setPhone("");
    setTag("new");
    setErrors({});
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  }

  function validate(): boolean {
    const next: { name?: string; email?: string } = {};
    if (!name.trim()) {
      next.name = "Name is required";
    }
    if (!email.trim()) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Invalid email format";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      email: email.trim(),
      company: company.trim() || undefined,
      phone: phone.trim() || undefined,
      tag,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Create a new customer to add to this quote.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="customer-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customer-name"
              placeholder="Customer name"
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
          <div className="space-y-2">
            <Label htmlFor="customer-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-company">Company</Label>
            <Input
              id="customer-company"
              placeholder="Company name (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone</Label>
            <Input
              id="customer-phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-tag">Customer Type</Label>
            <Select value={tag} onValueChange={(v) => setTag(v as CustomerTag)}>
              <SelectTrigger id="customer-tag" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAG_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {CUSTOMER_TAG_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Customer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { CONTACT_ROLE_LABELS } from "@/lib/constants";
import { contactRoleEnum } from "@domain/entities/contact";
import type { Group } from "@domain/entities/group";

interface AddContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: Group[];
}

export function AddContactSheet({
  open,
  onOpenChange,
  groups,
}: AddContactSheetProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("ordering");
  const [roleDescription, setRoleDescription] = useState("");
  const [groupId, setGroupId] = useState<string>("none");
  const [isPrimary, setIsPrimary] = useState(false);

  function handleAdd() {
    // Phase 1: No actual save
    console.log("Contact added", {
      name,
      email: email || undefined,
      phone: phone || undefined,
      role,
      roleDescription: role === "other" ? roleDescription || undefined : undefined,
      groupId: groupId === "none" ? undefined : groupId,
      isPrimary,
    });
    resetForm();
    onOpenChange(false);
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setRole("ordering");
    setRoleDescription("");
    setGroupId("none");
    setIsPrimary(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add Contact</SheetTitle>
          <SheetDescription>
            Add a new contact person to this customer.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">
              Name <span className="text-error">*</span>
            </Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input
              id="contact-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => {
                setRole(value);
                if (value !== "other") setRoleDescription("");
              }}
            >
              <SelectTrigger className="w-full" aria-label="Contact role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contactRoleEnum.options.map((r) => (
                  <SelectItem key={r} value={r}>
                    {CONTACT_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {role === "other" && (
              <Input
                id="contact-role-description"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="e.g. Team Manager, Event Coordinator"
                aria-label="Role description"
              />
            )}
          </div>

          {groups.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="contact-group">Group</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="w-full" aria-label="Contact group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No group</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
              aria-label="Primary contact"
            />
            Primary contact
          </label>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim()}>
            Add Contact
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

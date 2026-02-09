"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, User, Building2, Mail, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { CUSTOMER_TAG_LABELS, CUSTOMER_TAG_COLORS } from "@/lib/constants";
import type { CustomerTag } from "@/lib/schemas/customer";

/** Subset of Customer fields needed by the combobox */
export interface CustomerOption {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  tag?: CustomerTag;
}

export interface CustomerComboboxProps {
  customers: CustomerOption[];
  selectedCustomerId?: string;
  onSelect: (customerId: string) => void;
  onAddNew?: () => void;
}

export function CustomerCombobox({
  customers,
  selectedCustomerId,
  onSelect,
  onAddNew,
}: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select customer"
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedCustomer
                ? selectedCustomer.name
                : "Select customer..."}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command
            filter={(value, search) => {
              const customer = customers.find((c) => c.id === value);
              if (!customer) return 0;
              const haystack =
                `${customer.name} ${customer.company}`.toLowerCase();
              return haystack.includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <CommandInput placeholder="Search customers..." />
            <CommandList>
              <CommandEmpty>No customers found.</CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={(currentValue) => {
                      onSelect(currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        selectedCustomerId === customer.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span className="truncate">
                      {customer.name}
                      <span className="text-muted-foreground"> — {customer.company}</span>
                    </span>
                    {customer.tag && (
                      <Badge
                        variant="ghost"
                        className={cn(
                          "ml-auto text-xs shrink-0",
                          CUSTOMER_TAG_COLORS[customer.tag]
                        )}
                      >
                        {CUSTOMER_TAG_LABELS[customer.tag]}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {onAddNew && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onAddNew();
                        setOpen(false);
                      }}
                    >
                      <Plus className="mr-2 size-4" />
                      Add New Customer
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCustomer && (
        <div className="rounded-md border bg-elevated p-3 space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <User className="size-4 shrink-0 text-muted-foreground" />
            <span>{selectedCustomer.name}</span>
            {selectedCustomer.tag && (
              <Badge
                variant="ghost"
                className={cn(
                  "text-xs",
                  CUSTOMER_TAG_COLORS[selectedCustomer.tag]
                )}
              >
                {CUSTOMER_TAG_LABELS[selectedCustomer.tag]}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            <span>{selectedCustomer.company}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <span>{selectedCustomer.email}</span>
          </div>
          {selectedCustomer.phone && (
            <div className="flex items-center gap-2 text-foreground">
              <Phone className="size-4 shrink-0 text-muted-foreground" />
              <span>{selectedCustomer.phone}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

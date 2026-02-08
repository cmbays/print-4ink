"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, User, Building2, Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

export interface CustomerOption {
  id: string;
  name: string;
  company: string;
  email: string;
}

export interface CustomerComboboxProps {
  customers: CustomerOption[];
  selectedCustomerId?: string;
  onSelect: (customerId: string) => void;
  onAddNew?: () => void;
}

export const MOCK_CUSTOMERS: CustomerOption[] = [
  {
    id: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    name: "Marcus Rivera",
    company: "River City Brewing Co.",
    email: "marcus@rivercitybrewing.com",
  },
  {
    id: "d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    name: "Sarah Chen",
    company: "Lonestar Lacrosse League",
    email: "sarah@lonestarlax.org",
  },
  {
    id: "e3c4d5e6-f7a8-4b9c-8d1e-2f3a4b5c6d7e",
    name: "Jake Thompson",
    company: "Thompson Family Reunion 2026",
    email: "jake.thompson@gmail.com",
  },
];

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
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            <span>{selectedCustomer.company}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <span>{selectedCustomer.email}</span>
          </div>
        </div>
      )}
    </div>
  );
}

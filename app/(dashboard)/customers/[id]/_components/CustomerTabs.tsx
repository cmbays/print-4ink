"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ActivityTimeline } from "./ActivityTimeline";
import { CustomerQuotesTable } from "./CustomerQuotesTable";
import { CustomerJobsTable } from "./CustomerJobsTable";
import { ArtworkGallery } from "@/components/features/ArtworkGallery";
import { ContactHierarchy } from "./ContactHierarchy";
import { CustomerDetailsPanel } from "./CustomerDetailsPanel";
import { CustomerScreensTab } from "./CustomerScreensTab";
import { NotesPanel } from "@/components/features/NotesPanel";
import { deriveScreensFromJobs } from "@/lib/helpers/screen-helpers";
import type { Customer } from "@/lib/schemas/customer";
import type { Quote } from "@/lib/schemas/quote";
import type { Job } from "@/lib/schemas/job";
import type { Artwork } from "@/lib/schemas/artwork";
import type { Invoice } from "@/lib/schemas/invoice";
import type { Note } from "@/lib/schemas/note";
import { CustomerInvoicesTable } from "./CustomerInvoicesTable";

interface CustomerTabsProps {
  customer: Customer;
  customers: Customer[];
  quotes: Quote[];
  jobs: Job[];
  invoices: Invoice[];
  artworks: Artwork[];
  notes: Note[];
}

export function CustomerTabs({
  customer,
  customers,
  quotes,
  jobs,
  invoices,
  artworks,
  notes,
}: CustomerTabsProps) {
  const defaultTab = customer.lifecycleStage === "prospect" ? "notes" : "activity";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const screens = deriveScreensFromJobs(customer.id);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList
        variant="line"
        className="w-full justify-start gap-0 border-b border-border pb-0"
      >
        <TabsTrigger value="activity" className="px-2 text-xs md:text-sm md:px-3">Activity</TabsTrigger>
        <TabsTrigger value="quotes" className="px-2 text-xs md:text-sm md:px-3">
          Quotes{quotes.length > 0 && ` (${quotes.length})`}
        </TabsTrigger>
        <TabsTrigger value="jobs" className="px-2 text-xs md:text-sm md:px-3">
          Jobs{jobs.length > 0 && ` (${jobs.length})`}
        </TabsTrigger>
        <TabsTrigger value="invoices" className="px-2 text-xs md:text-sm md:px-3">
          Invoices{invoices.length > 0 && ` (${invoices.length})`}
        </TabsTrigger>
        <TabsTrigger value="artwork" className="px-2 text-xs md:text-sm md:px-3">
          Artwork{artworks.length > 0 && ` (${artworks.length})`}
        </TabsTrigger>
        <TabsTrigger value="screens" className="px-2 text-xs md:text-sm md:px-3">
          Screens{screens.length > 0 && ` (${screens.length})`}
        </TabsTrigger>
        <TabsTrigger value="contacts" className="px-2 text-xs md:text-sm md:px-3">
          Contacts{customer.contacts.length > 0 && ` (${customer.contacts.length})`}
        </TabsTrigger>
        <TabsTrigger value="details" className="px-2 text-xs md:text-sm md:px-3">Details</TabsTrigger>
        <TabsTrigger value="notes" className="px-2 text-xs md:text-sm md:px-3">
          Notes{notes.length > 0 && ` (${notes.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="activity" className="mt-4">
        <ActivityTimeline
          quotes={quotes}
          jobs={jobs}
          notes={notes}
          onSwitchTab={setActiveTab}
        />
      </TabsContent>

      <TabsContent value="quotes" className="mt-4">
        <CustomerQuotesTable quotes={quotes} />
      </TabsContent>

      <TabsContent value="jobs" className="mt-4">
        <CustomerJobsTable jobs={jobs} />
      </TabsContent>

      <TabsContent value="invoices" className="mt-4">
        <CustomerInvoicesTable invoices={invoices} />
      </TabsContent>

      <TabsContent value="artwork" className="mt-4">
        <ArtworkGallery
          artworks={artworks}
          customerId={customer.id}
        />
      </TabsContent>

      <TabsContent value="screens" className="mt-4">
        <CustomerScreensTab customerId={customer.id} />
      </TabsContent>

      <TabsContent value="contacts" className="mt-4">
        <ContactHierarchy customer={customer} />
      </TabsContent>

      <TabsContent value="details" className="mt-4">
        <CustomerDetailsPanel customer={customer} customers={customers} />
      </TabsContent>

      <TabsContent value="notes" className="mt-4">
        <NotesPanel
          notes={notes}
          entityType="customer"
          entityId={customer.id}
        />
      </TabsContent>
    </Tabs>
  );
}

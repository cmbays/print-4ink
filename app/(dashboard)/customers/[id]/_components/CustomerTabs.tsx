"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ActivityTimeline } from "./ActivityTimeline";
import { CustomerQuotesTable } from "./CustomerQuotesTable";
import { CustomerJobsTable } from "./CustomerJobsTable";
import { ArtworkGallery } from "@/components/features/ArtworkGallery";
import { ContactHierarchy } from "./ContactHierarchy";
import { CustomerDetailsPanel } from "./CustomerDetailsPanel";
import { NotesPanel } from "@/components/features/NotesPanel";
import type { Customer } from "@/lib/schemas/customer";
import type { Quote } from "@/lib/schemas/quote";
import type { Job } from "@/lib/schemas/job";
import type { Artwork } from "@/lib/schemas/artwork";
import type { Note } from "@/lib/schemas/note";

interface CustomerTabsProps {
  customer: Customer;
  customers: Customer[];
  quotes: Quote[];
  jobs: Job[];
  artworks: Artwork[];
  notes: Note[];
}

export function CustomerTabs({
  customer,
  customers,
  quotes,
  jobs,
  artworks,
  notes,
}: CustomerTabsProps) {
  const defaultTab = customer.lifecycleStage === "prospect" ? "notes" : "activity";

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList
        variant="line"
        className="w-full overflow-x-auto justify-start border-b border-border pb-0"
      >
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="quotes">
          Quotes{quotes.length > 0 && ` (${quotes.length})`}
        </TabsTrigger>
        <TabsTrigger value="jobs">
          Jobs{jobs.length > 0 && ` (${jobs.length})`}
        </TabsTrigger>
        <TabsTrigger value="artwork">
          Artwork{artworks.length > 0 && ` (${artworks.length})`}
        </TabsTrigger>
        <TabsTrigger value="contacts">
          Contacts{customer.contacts.length > 0 && ` (${customer.contacts.length})`}
        </TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="notes">
          Notes{notes.length > 0 && ` (${notes.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="activity" className="mt-4">
        <ActivityTimeline
          quotes={quotes}
          jobs={jobs}
          notes={notes}
        />
      </TabsContent>

      <TabsContent value="quotes" className="mt-4">
        <CustomerQuotesTable quotes={quotes} />
      </TabsContent>

      <TabsContent value="jobs" className="mt-4">
        <CustomerJobsTable jobs={jobs} />
      </TabsContent>

      <TabsContent value="artwork" className="mt-4">
        <ArtworkGallery
          artworks={artworks}
          customerId={customer.id}
        />
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

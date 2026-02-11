"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { PricingTemplateCard } from "@/components/features/PricingTemplateCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag, Search, Printer, Layers } from "lucide-react";
import {
  allScreenPrintTemplates,
  allDTFTemplates,
  tagTemplateMappings,
} from "@/lib/mock-data-pricing";
import { customers } from "@/lib/mock-data";
import {
  calculateTemplateHealth,
  calculateDTFTemplateHealth,
} from "@/lib/pricing-engine";
import type { PricingTemplate } from "@/lib/schemas/price-matrix";
import type { DTFPricingTemplate } from "@/lib/schemas/dtf-pricing";
import type { MarginIndicator } from "@/lib/schemas/price-matrix";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ServiceTypeTab = "screen-print" | "dtf";

function countCustomersUsingTemplate(
  templateId: string,
  serviceType: ServiceTypeTab
): number {
  // Count customers whose type tags map to this template
  const mappedTags = tagTemplateMappings
    .filter((m) =>
      serviceType === "screen-print"
        ? m.screenPrintTemplateId === templateId
        : m.dtfTemplateId === templateId
    )
    .map((m) => m.customerTypeTag);

  return customers.filter((c) =>
    c.typeTags.some((tag) => mappedTags.includes(tag))
  ).length;
}

// Default garment base cost for margin calculations (avg t-shirt cost)
const DEFAULT_GARMENT_COST = 3.5;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PricingHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ServiceTypeTab>("screen-print");
  const [searchQuery, setSearchQuery] = useState("");

  // Mutable template state (for Phase 1 client-side operations)
  const [spTemplates, setSpTemplates] = useState<PricingTemplate[]>(
    allScreenPrintTemplates
  );
  const [dtfTemplates, setDtfTemplates] = useState<DTFPricingTemplate[]>(
    allDTFTemplates
  );

  // Filter templates by search
  const filteredSPTemplates = useMemo(
    () =>
      spTemplates.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [spTemplates, searchQuery]
  );

  const filteredDTFTemplates = useMemo(
    () =>
      dtfTemplates.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [dtfTemplates, searchQuery]
  );

  // Template actions
  const handleEditSP = (id: string) => {
    router.push(`/settings/pricing/screen-print/${id}`);
  };

  const handleEditDTF = (id: string) => {
    router.push(`/settings/pricing/dtf/${id}`);
  };

  const handleDuplicateSP = (template: PricingTemplate) => {
    const newId = crypto.randomUUID();
    const duplicate: PricingTemplate = {
      ...template,
      id: newId,
      name: `${template.name} (Copy)`,
      isDefault: false,
      isIndustryDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSpTemplates((prev) => [...prev, duplicate]);
  };

  const handleDuplicateDTF = (template: DTFPricingTemplate) => {
    const newId = crypto.randomUUID();
    const duplicate: DTFPricingTemplate = {
      ...template,
      id: newId,
      name: `${template.name} (Copy)`,
      isDefault: false,
      isIndustryDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDtfTemplates((prev) => [...prev, duplicate]);
  };

  const handleDeleteSP = (id: string) => {
    setSpTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDeleteDTF = (id: string) => {
    setDtfTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSetDefaultSP = (id: string) => {
    setSpTemplates((prev) =>
      prev.map((t) => ({ ...t, isDefault: t.id === id }))
    );
  };

  const handleSetDefaultDTF = (id: string) => {
    setDtfTemplates((prev) =>
      prev.map((t) => ({ ...t, isDefault: t.id === id }))
    );
  };

  // Health indicators (memoized)
  const spHealthMap = useMemo(() => {
    const map = new Map<string, MarginIndicator>();
    spTemplates.forEach((t) => {
      map.set(t.id, calculateTemplateHealth(t, DEFAULT_GARMENT_COST));
    });
    return map;
  }, [spTemplates]);

  const dtfHealthMap = useMemo(() => {
    const map = new Map<string, MarginIndicator>();
    dtfTemplates.forEach((t) => {
      map.set(t.id, calculateDTFTemplateHealth(t));
    });
    return map;
  }, [dtfTemplates]);

  // Total template count per tab
  const spCount = spTemplates.length;
  const dtfCount = dtfTemplates.length;

  return (
    <>
      <Topbar
        breadcrumbs={[
          { label: "Settings", href: "/settings/pricing" },
          { label: "Pricing" },
        ]}
      />

      <div className="flex flex-col gap-6 p-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Pricing Templates</h1>
            <p className="text-sm text-muted-foreground">
              Configure pricing matrices for screen print and DTF services
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Open P1.2 Tag-Template Mapping Sheet
              }}
            >
              <Tag className="size-4" />
              Manage Mappings
            </Button>
            <Button
              size="sm"
              onClick={() => {
                // TODO: Open P1.1 New Template Wizard
              }}
            >
              <Plus className="size-4" />
              New Template
            </Button>
          </div>
        </div>

        {/* Tabs + Search row */}
        <div className="flex items-center justify-between gap-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ServiceTypeTab)}
          >
            <TabsList>
              <TabsTrigger value="screen-print" className="gap-1.5">
                <Printer className="size-3.5" />
                Screen Print
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 px-1 text-[10px]"
                >
                  {spCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="dtf" className="gap-1.5">
                <Layers className="size-3.5" />
                DTF
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 px-1 text-[10px]"
                >
                  {dtfCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* Template grid */}
        {activeTab === "screen-print" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSPTemplates.map((template) => (
              <PricingTemplateCard
                key={template.id}
                template={template}
                healthIndicator={spHealthMap.get(template.id) ?? "caution"}
                customersUsing={countCustomersUsingTemplate(
                  template.id,
                  "screen-print"
                )}
                onEdit={() => handleEditSP(template.id)}
                onDuplicate={() => handleDuplicateSP(template)}
                onDelete={() => handleDeleteSP(template.id)}
                onSetDefault={() => handleSetDefaultSP(template.id)}
              />
            ))}
            {filteredSPTemplates.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
                <Printer className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No templates match your search"
                    : "No screen print templates yet"}
                </p>
                {!searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Open wizard
                    }}
                  >
                    <Plus className="size-4" />
                    Create Template
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "dtf" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDTFTemplates.map((template) => (
              <PricingTemplateCard
                key={template.id}
                template={{
                  ...template,
                  pricingTier: template.isDefault ? "default" : "custom",
                }}
                healthIndicator={dtfHealthMap.get(template.id) ?? "caution"}
                customersUsing={countCustomersUsingTemplate(
                  template.id,
                  "dtf"
                )}
                onEdit={() => handleEditDTF(template.id)}
                onDuplicate={() => handleDuplicateDTF(template)}
                onDelete={() => handleDeleteDTF(template.id)}
                onSetDefault={() => handleSetDefaultDTF(template.id)}
              />
            ))}
            {filteredDTFTemplates.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
                <Layers className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No templates match your search"
                    : "No DTF templates yet"}
                </p>
                {!searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Open wizard
                    }}
                  >
                    <Plus className="size-4" />
                    Create Template
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

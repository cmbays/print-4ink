import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { customers, quotes, jobs, invoices, artworks, customerNotes } from "@/lib/mock-data";
import { money, round2, toNumber } from "@/lib/helpers/money";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CustomerDetailHeader } from "./_components/CustomerDetailHeader";
import { CustomerTabs } from "./_components/CustomerTabs";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="rounded-lg border border-border bg-card p-8 text-center" role="alert">
          <h2 className="text-xl font-semibold text-foreground">
            Customer not found
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This customer doesn&apos;t exist or has been removed.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/customers">
              <ArrowLeft className="size-4" />
              Back to Customers
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const customerQuotes = quotes.filter((q) => q.customerId === id);
  const customerJobs = jobs.filter((j) => j.customerId === id);
  const customerInvoices = invoices.filter((inv) => inv.customerId === id);
  const customerArtworks = artworks.filter((a) => a.customerId === id);
  const notes = customerNotes.filter(
    (n) => n.entityType === "customer" && n.entityId === id
  );

  // Compute stats for the header
  const lifetimeRevenue = toNumber(
    customerQuotes
      .filter((q) => q.status === "accepted")
      .reduce((sum, q) => sum.plus(money(q.total)), money(0)),
  );
  const totalOrders = customerJobs.length;
  const avgOrderValue = totalOrders > 0
    ? toNumber(round2(money(lifetimeRevenue).div(totalOrders)))
    : 0;
  const lastOrderDate =
    customerJobs.length > 0
      ? customerJobs
          .map((j) => j.dueDate)
          .sort()
          .reverse()[0] ?? null
      : null;
  const referralCount = customers.filter(
    (c) => c.referredByCustomerId === id
  ).length;

  const stats = {
    lifetimeRevenue,
    totalOrders,
    avgOrderValue,
    lastOrderDate,
    referralCount,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/customers">Customers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{customer.company}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <CustomerDetailHeader customer={customer} stats={stats} />

      {/* Tabs */}
      <CustomerTabs
        customer={customer}
        customers={customers}
        quotes={customerQuotes}
        jobs={customerJobs}
        invoices={customerInvoices}
        artworks={customerArtworks}
        notes={notes}
      />
    </div>
  );
}

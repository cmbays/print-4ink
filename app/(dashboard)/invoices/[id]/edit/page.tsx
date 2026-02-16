import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { invoices } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs } from "@/lib/helpers/breadcrumbs";
import { InvoiceForm } from "@/app/(dashboard)/invoices/_components/InvoiceForm";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = invoices.find((inv) => inv.id === id);

  if (!invoice) {
    return (
      <>
        <Topbar
          breadcrumbs={buildBreadcrumbs(
            { label: "Invoices", href: "/invoices" },
            { label: "Not Found" },
          )}
        />
        <div className="flex flex-col items-center justify-center py-24">
          <div
            className="rounded-lg border border-border bg-card p-8 text-center"
            role="alert"
          >
            <h2 className="text-xl font-semibold text-foreground">
              Invoice not found
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This invoice doesn&apos;t exist or has been removed.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/invoices">
                <ArrowLeft className="size-4" />
                Back to Invoices
              </Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Only draft invoices can be edited
  if (invoice.status !== "draft") {
    redirect(`/invoices/${id}`);
  }

  return (
    <>
      <Topbar
        breadcrumbs={buildBreadcrumbs(
          { label: "Invoices", href: "/invoices" },
          { label: invoice.invoiceNumber, href: `/invoices/${id}` },
          { label: "Edit" },
        )}
      />
      <div className="mx-auto max-w-4xl space-y-6 py-6">
        <InvoiceForm mode="edit" initialData={invoice} />
      </div>
    </>
  );
}

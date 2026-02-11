import { Topbar } from "@/components/layout/topbar";

export default async function DTFEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <Topbar
        breadcrumbs={[
          { label: "Settings", href: "/settings/pricing" },
          { label: "Pricing", href: "/settings/pricing" },
          { label: "DTF Editor" },
        ]}
      />
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <p className="text-lg font-semibold">DTF Matrix Editor</p>
        <p className="text-sm text-muted-foreground">
          Template ID: {id}
        </p>
        <p className="text-sm text-muted-foreground">
          Coming in Phase B — sheet-size pricing tiers, customer discounts,
          rush fees, and margin indicators.
        </p>
      </div>
    </>
  );
}

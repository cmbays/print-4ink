import { Topbar } from "@/components/layout/topbar";

export default async function ScreenPrintEditorPage({
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
          { label: "Screen Print Editor" },
        ]}
      />
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <p className="text-lg font-semibold">Screen Print Matrix Editor</p>
        <p className="text-sm text-muted-foreground">
          Template ID: {id}
        </p>
        <p className="text-sm text-muted-foreground">
          Coming in Phase B — full matrix editor with Simple/Power modes,
          margin indicators, and sandbox mode.
        </p>
      </div>
    </>
  );
}

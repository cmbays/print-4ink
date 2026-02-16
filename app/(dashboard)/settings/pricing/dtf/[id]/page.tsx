import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs } from "@/lib/helpers/breadcrumbs";
import { DTFEditorClient } from "./dtf-editor-client";

export default async function DTFEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <Topbar
        breadcrumbs={buildBreadcrumbs(
          { label: "Pricing", href: "/settings/pricing" },
          { label: "DTF Editor" },
        )}
      />
      <DTFEditorClient templateId={id} />
    </>
  );
}

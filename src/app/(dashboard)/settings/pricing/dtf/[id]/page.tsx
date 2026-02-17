import { Topbar } from "@shared/ui/layouts/topbar";
import { buildBreadcrumbs, CRUMBS } from "@shared/lib/breadcrumbs";
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
          CRUMBS.pricing,
          { label: "DTF Editor" },
        )}
      />
      <DTFEditorClient templateId={id} />
    </>
  );
}

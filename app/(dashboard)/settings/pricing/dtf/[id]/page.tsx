import { Topbar } from "@/components/layout/topbar";
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
        breadcrumbs={[
          { label: "Pricing", href: "/settings/pricing" },
          { label: "DTF Editor" },
        ]}
      />
      <DTFEditorClient templateId={id} />
    </>
  );
}

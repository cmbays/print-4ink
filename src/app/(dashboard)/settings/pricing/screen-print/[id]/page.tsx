import { Topbar } from "@shared/ui/layouts/topbar";
import { buildBreadcrumbs, CRUMBS } from "@shared/lib/breadcrumbs";
import { ScreenPrintEditor } from "./editor";

export default async function ScreenPrintEditorPage({
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
          { label: "Screen Print Editor" },
        )}
      />
      <ScreenPrintEditor templateId={id} />
    </>
  );
}

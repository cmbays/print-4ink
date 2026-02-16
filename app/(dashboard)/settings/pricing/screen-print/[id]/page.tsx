import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs } from "@/lib/helpers/breadcrumbs";
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
          { label: "Pricing", href: "/settings/pricing" },
          { label: "Screen Print Editor" },
        )}
      />
      <ScreenPrintEditor templateId={id} />
    </>
  );
}

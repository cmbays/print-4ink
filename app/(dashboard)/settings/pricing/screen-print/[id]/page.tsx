import { Topbar } from "@/components/layout/topbar";
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
        breadcrumbs={[
          { label: "Pricing", href: "/settings/pricing" },
          { label: "Screen Print Editor" },
        ]}
      />
      <ScreenPrintEditor templateId={id} />
    </>
  );
}

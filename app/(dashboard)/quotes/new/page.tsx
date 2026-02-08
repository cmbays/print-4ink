import { QuoteForm } from "../_components/QuoteForm";

export default function NewQuotePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">New Quote</h1>
      <QuoteForm mode="create" />
    </div>
  );
}

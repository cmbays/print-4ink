"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuoteDetailView } from "./QuoteDetailView";
import type { Quote } from "@/lib/schemas/quote";
import type { Customer } from "@/lib/schemas/customer";
import type { Artwork } from "@/lib/schemas/artwork";

interface QuoteReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  customer: Customer | null;
  artworks: Artwork[];
}

export function QuoteReviewSheet({
  open,
  onOpenChange,
  quote,
  customer,
  artworks,
}: QuoteReviewSheetProps) {
  const router = useRouter();

  function handleSend() {
    toast.success("Quote sent to customer", {
      description: customer ? `Email sent to ${customer.email}` : "Quote marked as sent.",
    });
    onOpenChange(false);
    router.push("/quotes");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>Review Quote</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-5rem)] px-6 pb-6">
          <QuoteDetailView
            quote={quote}
            customer={customer}
            artworks={artworks}
            mode="review"
            onSend={handleSend}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

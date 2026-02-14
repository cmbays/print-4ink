import { cn } from "@/lib/utils";

interface MobileCardListProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function MobileCardList<T>({
  items,
  renderCard,
  emptyMessage = "No items found",
  className,
}: MobileCardListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-(--mobile-card-gap) md:hidden",
        className
      )}
    >
      {items.map((item, index) => renderCard(item, index))}
    </div>
  );
}

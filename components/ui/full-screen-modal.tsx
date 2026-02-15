"use client";

import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FullScreenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function FullScreenModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: FullScreenModalProps) {
  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          isMobile &&
            "h-full max-h-full w-full max-w-full rounded-none border-0 p-0"
        )}
        showCloseButton={!isMobile}
      >
        {isMobile ? (
          <div className="flex h-full flex-col">
            {/* Mobile header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">{title}</h2>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
            {/* Sticky footer */}
            {footer && (
              <div className="border-t border-border p-4 pb-safe">
                {footer}
              </div>
            )}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
            {children}
            {footer}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

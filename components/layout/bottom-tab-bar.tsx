"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV } from "@/lib/constants/navigation";

const tabs = [
  ...PRIMARY_NAV,
  { label: "More", href: "#more", icon: MoreHorizontal },
] as const;

interface BottomTabBarProps {
  onMorePress: () => void;
}

export function BottomTabBar({ onMorePress }: BottomTabBarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "#more") return false;
    return pathname.startsWith(href.split("/").slice(0, 2).join("/"));
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-(--mobile-nav-height) items-center justify-around border-t border-border bg-sidebar pb-safe md:hidden"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        const isMore = tab.href === "#more";

        if (isMore) {
          return (
            <button
              key={tab.label}
              onClick={onMorePress}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-1",
                "text-muted-foreground transition-colors",
                "min-h-(--mobile-touch-target)"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-1",
              "transition-colors min-h-(--mobile-touch-target)",
              active
                ? "text-action"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Calculator,
  Receipt,
  Users,
  Layers,
  Package,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Quotes", href: "/quotes", icon: Calculator },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Jobs", href: "/jobs", icon: ClipboardList },
  { name: "Screen Room", href: "/screens", icon: Layers },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Garments", href: "/garments", icon: Package },
];

const settingsNavigation = [
  { name: "Pricing", href: "/settings/pricing", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <Layers className="h-6 w-6 text-action" />
        <span className="text-sm font-semibold tracking-tight">
          Screen Print Pro
        </span>
      </div>
      <nav className="flex flex-1 flex-col px-2 py-3">
        <div className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="mx-3 my-3 border-t border-sidebar-border" />

        <div className="space-y-1">
          <span className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Settings
          </span>
          {settingsNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

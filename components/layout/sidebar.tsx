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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Jobs", href: "/jobs", icon: ClipboardList },
  { name: "Quotes", href: "/quotes", icon: Calculator },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Screen Room", href: "/screens", icon: Layers },
  { name: "Garments", href: "/garments", icon: Package },
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
      <nav className="flex-1 space-y-1 px-2 py-3">
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
      </nav>
    </aside>
  );
}

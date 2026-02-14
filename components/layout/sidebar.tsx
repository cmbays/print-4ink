"use client";

import {
  LayoutDashboard,
  Hammer,
  FileSignature,
  Receipt,
  Users,
  Layers,
  Printer,
  Shirt,
  Settings,
} from "lucide-react";
import { SidebarNavLink } from "./SidebarNavLink";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Quotes", href: "/quotes", icon: FileSignature, iconColor: "text-magenta" },
  { name: "Invoices", href: "/invoices", icon: Receipt, iconColor: "text-success" },
  { name: "Jobs", href: "/jobs/board", icon: Hammer, activePrefix: "/jobs", iconColor: "text-purple" },
  { name: "Screen Room", href: "/screens", icon: Printer, iconColor: "text-action" },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Garments", href: "/garments", icon: Shirt },
] satisfies Array<{ name: string; href: string; icon: typeof LayoutDashboard; activePrefix?: string; iconColor?: string }>;

const settingsNavigation = [
  { name: "Pricing", href: "/settings/pricing", icon: Settings },
];

export function Sidebar() {
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
          {navigation.map((item) => (
            <SidebarNavLink key={item.name} {...item} />
          ))}
        </div>

        <div className="mx-3 my-3 border-t border-sidebar-border" />

        <div className="space-y-1">
          <span className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Settings
          </span>
          {settingsNavigation.map((item) => (
            <SidebarNavLink key={item.name} {...item} />
          ))}
        </div>
      </nav>
    </aside>
  );
}

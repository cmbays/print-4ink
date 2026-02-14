import {
  LayoutDashboard,
  Hammer,
  FileSignature,
  Users,
  Receipt,
  Printer,
  Shirt,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  iconColor?: string;
  activePrefix?: string;
}

/** Primary navigation — shown in Sidebar + BottomTabBar */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Jobs", href: "/jobs/board", icon: Hammer, activePrefix: "/jobs", iconColor: "text-purple" },
  { label: "Quotes", href: "/quotes", icon: FileSignature, iconColor: "text-magenta" },
  { label: "Customers", href: "/customers", icon: Users },
];

/** Secondary navigation — shown in Sidebar + MobileDrawer */
export const SECONDARY_NAV: NavItem[] = [
  { label: "Invoices", href: "/invoices", icon: Receipt, iconColor: "text-success" },
  { label: "Screen Room", href: "/screens", icon: Printer, iconColor: "text-action" },
  { label: "Garments", href: "/garments", icon: Shirt },
  { label: "Pricing Settings", href: "/settings/pricing", icon: Settings },
];

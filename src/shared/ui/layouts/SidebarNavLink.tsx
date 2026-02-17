"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@shared/lib/cn";
import type { LucideIcon } from "lucide-react";

interface SidebarNavLinkProps {
  label: string;
  href: string;
  icon: LucideIcon;
  iconColor?: string;
  activePrefix?: string;
}

export function SidebarNavLink({
  label,
  href,
  icon: Icon,
  iconColor,
  activePrefix,
}: SidebarNavLinkProps) {
  const pathname = usePathname();
  const prefix = activePrefix ?? href;
  const isActive =
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        isActive
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className={cn("h-4 w-4", iconColor)} />
      {label}
    </Link>
  );
}

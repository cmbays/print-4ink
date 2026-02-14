"use client";

import { useState } from "react";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { MobileHeader } from "@/components/layout/mobile-header";

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile header — hidden on desktop */}
      <MobileHeader />

      {/* Page content with bottom padding for tab bar on mobile */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
        {children}
      </main>

      {/* Mobile navigation — hidden on desktop */}
      <BottomTabBar onMorePress={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}

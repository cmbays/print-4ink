import { Sidebar } from "@/components/layout/sidebar";
import { MobileShell } from "@/components/layout/mobile-shell";
import { TooltipProviderWrapper } from "@/components/layout/tooltip-provider-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProviderWrapper>
      <div className="flex h-screen">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Mobile shell manages all client state (drawer, header, tab bar) */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <MobileShell>
            {children}
          </MobileShell>
        </div>
      </div>
    </TooltipProviderWrapper>
  );
}

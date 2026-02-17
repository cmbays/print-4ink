import { Sidebar } from '@shared/ui/layouts/sidebar'
import { MobileShell } from '@shared/ui/layouts/mobile-shell'
import { TooltipProviderWrapper } from '@shared/ui/layouts/tooltip-provider-wrapper'
import { ErrorBoundary } from '@shared/ui/error-boundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
            <ErrorBoundary>{children}</ErrorBoundary>
          </MobileShell>
        </div>
      </div>
    </TooltipProviderWrapper>
  )
}

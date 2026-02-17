import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@shared/ui/primitives/breadcrumb'
import type { BreadcrumbSegment } from '@shared/lib/breadcrumbs'

type TopbarProps = {
  breadcrumbs?: BreadcrumbSegment[]
}

export function Topbar({ breadcrumbs }: TopbarProps) {
  return (
    <header className="-mx-6 -mt-6 mb-6 flex h-14 items-center border-b border-border px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs?.map((crumb) => (
            <span key={crumb.label} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {crumb.href ? (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}

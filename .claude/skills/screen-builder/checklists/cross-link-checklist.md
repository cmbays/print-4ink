# Cross-Link Checklist

Verify navigation is wired correctly per APP_FLOW.md.

## Breadcrumbs

- [ ] Breadcrumb trail matches APP_FLOW breadcrumb table for this route
- [ ] Dashboard link points to `/`
- [ ] Parent list link points to correct list route (e.g., `/jobs`, `/quotes`, `/customers`)
- [ ] Current page shows as `BreadcrumbPage` (not a link)

## Cross-Links (from APP_FLOW Cross-Links section)

- [ ] Customer name links → `/customers/[customerId]` (on Job Detail, Quote Detail)
- [ ] Job number links → `/jobs/[jobId]` (on Customer Detail, Screen Room)
- [ ] Quote number links → `/quotes/[quoteId]` (on Customer Detail)
- [ ] Table row clicks navigate to detail page

## Sidebar

- [ ] Active state highlights current route in sidebar
- [ ] Exact match for `/` (Dashboard), prefix match for others

## Back Navigation

- [ ] Breadcrumb provides path back to parent
- [ ] No dead ends — user can always navigate back

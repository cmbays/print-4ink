'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Eye,
  MoreHorizontal,
  Package,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  ArrowRightLeft,
  X,
} from 'lucide-react'

import { z } from 'zod'
import { ENTITY_STYLES } from '@domain/constants/entities'
import { ENTITY_ICONS } from '@/lib/constants/entity-icons'
import { cn } from '@shared/lib/cn'
import { Button } from '@shared/ui/primitives/button'
import { Input } from '@shared/ui/primitives/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/primitives/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/primitives/dropdown-menu'
import { ServiceTypeBadge } from '@features/pricing/components/ServiceTypeBadge'
import { RiskIndicator } from '@features/quotes/components/RiskIndicator'
import { LaneBadge } from '@shared/ui/organisms/LaneBadge'
import { TaskProgressBar } from '@features/jobs/components/TaskProgressBar'
import { ColumnHeaderMenu } from '@shared/ui/organisms/ColumnHeaderMenu'
import { MobileFilterSheet } from '@shared/ui/organisms/MobileFilterSheet'
import { MoneyAmount } from '@shared/ui/organisms/MoneyAmount'
import { computeTaskProgress } from '@domain/rules/job.rules'
import { formatDate } from '@shared/lib/format'
import { LANE_LABELS, RISK_LABELS, SERVICE_TYPE_LABELS } from '@domain/constants'
import type { Job, Lane, RiskLevel } from '@domain/entities/job'
import type { ServiceType } from '@domain/entities/quote'
import type { Customer } from '@domain/entities/customer'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type JobsDataTableProps = {
  jobs: Job[]
  customers: Customer[]
  onMoveLane: (job: Job) => void
  onBlock: (job: Job) => void
  onUnblock: (job: Job) => void
}

// ---------------------------------------------------------------------------
// Sort key validation
// ---------------------------------------------------------------------------

const sortKeySchema = z.enum([
  'jobNumber',
  'customer',
  'serviceType',
  'quantity',
  'dueDate',
  'lane',
  'risk',
  'taskProgress',
])
type SortKey = z.infer<typeof sortKeySchema>

const sortDirSchema = z.enum(['asc', 'desc'])
type SortDir = z.infer<typeof sortDirSchema>

// ---------------------------------------------------------------------------
// Sort order maps
// ---------------------------------------------------------------------------

const LANE_ORDER: Record<Lane, number> = {
  ready: 0,
  in_progress: 1,
  review: 2,
  blocked: 3,
  done: 4,
}

const RISK_ORDER: Record<RiskLevel, number> = {
  on_track: 0,
  getting_tight: 1,
  at_risk: 2,
}

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const ALL_LANES: Lane[] = ['ready', 'in_progress', 'review', 'blocked', 'done']
const ALL_SERVICE_TYPES: ServiceType[] = ['screen-print', 'dtf', 'embroidery']
const ALL_RISKS: RiskLevel[] = ['on_track', 'getting_tight', 'at_risk']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JobsDataTable({
  jobs,
  customers,
  onMoveLane,
  onBlock,
  onUnblock,
}: JobsDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ---- URL state reads ----------------------------------------------------
  const searchQuery = searchParams.get('q') ?? ''
  const laneFilter = searchParams.get('lane') ?? ''
  const serviceTypeFilter = searchParams.get('serviceType') ?? ''
  const riskFilter = searchParams.get('risk') ?? ''
  const sortKeyParam = sortKeySchema.catch('dueDate').parse(searchParams.get('sort') ?? 'dueDate')
  const sortDirParam = sortDirSchema.catch('asc').parse(searchParams.get('dir') ?? 'asc')

  // ---- Local state (for debounced search) ---------------------------------
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [sortKey, setSortKey] = useState<SortKey>(sortKeyParam)
  const [sortDir, setSortDir] = useState<SortDir>(sortDirParam)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  // Sync search from URL when navigating back/forward
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  // Sync sort from URL when navigating back/forward
  useEffect(() => {
    setSortKey(sortKeyParam)
    setSortDir(sortDirParam)
  }, [sortKeyParam, sortDirParam])

  // ---- Debounced search -> URL --------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (localSearch) {
        params.set('q', localSearch)
      } else {
        params.delete('q')
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omitting searchParams to avoid re-render loop
  }, [localSearch, router])

  // ---- URL update helpers -------------------------------------------------

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value !== null) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router]
  )

  // ---- Lane filter --------------------------------------------------------

  const handleLaneFilterToggle = useCallback(
    (value: string) => {
      updateParam('lane', value === laneFilter ? null : value)
    },
    [laneFilter, updateParam]
  )

  const handleLaneFilterClear = useCallback(() => {
    updateParam('lane', null)
  }, [updateParam])

  // ---- Service type filter ------------------------------------------------

  const handleServiceTypeFilterToggle = useCallback(
    (value: string) => {
      updateParam('serviceType', value === serviceTypeFilter ? null : value)
    },
    [serviceTypeFilter, updateParam]
  )

  const handleServiceTypeFilterClear = useCallback(() => {
    updateParam('serviceType', null)
  }, [updateParam])

  // ---- Risk filter --------------------------------------------------------

  const handleRiskFilterToggle = useCallback(
    (value: string) => {
      updateParam('risk', value === riskFilter ? null : value)
    },
    [riskFilter, updateParam]
  )

  const handleRiskFilterClear = useCallback(() => {
    updateParam('risk', null)
  }, [updateParam])

  // ---- Sort ---------------------------------------------------------------

  const handleSort = useCallback(
    (key: SortKey, explicitDir?: SortDir) => {
      let nextDir: SortDir
      if (explicitDir) {
        nextDir = explicitDir
      } else if (sortKey === key) {
        nextDir = sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        nextDir = 'asc'
      }
      setSortKey(key)
      setSortDir(nextDir)

      const params = new URLSearchParams(searchParams.toString())
      params.set('sort', key)
      params.set('dir', nextDir)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [sortKey, sortDir, searchParams, router]
  )

  // ---- Customer name cache ------------------------------------------------

  const customerNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const job of jobs) {
      if (!map.has(job.customerId)) {
        const customer = customers.find((c) => c.id === job.customerId)
        map.set(job.customerId, customer?.company ?? customer?.name ?? 'Unknown')
      }
    }
    return map
  }, [jobs, customers])

  // ---- Filter + sort pipeline ---------------------------------------------

  const filteredJobs = useMemo(() => {
    let result = jobs

    // 1. Search filter (jobNumber, customer name, job title)
    if (searchQuery) {
      const lower = searchQuery.toLowerCase()
      result = result.filter((job) => {
        if (job.jobNumber.toLowerCase().includes(lower)) return true
        const name = customerNameMap.get(job.customerId) ?? ''
        if (name.toLowerCase().includes(lower)) return true
        if (job.title.toLowerCase().includes(lower)) return true
        return false
      })
    }

    // 2. Lane filter
    if (laneFilter) {
      result = result.filter((job) => job.lane === laneFilter)
    }

    // 3. Service type filter
    if (serviceTypeFilter) {
      result = result.filter((job) => job.serviceType === serviceTypeFilter)
    }

    // 4. Risk filter
    if (riskFilter) {
      result = result.filter((job) => job.riskLevel === riskFilter)
    }

    // 5. Sort
    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'jobNumber':
          cmp = a.jobNumber.localeCompare(b.jobNumber)
          break
        case 'customer': {
          const aName = customerNameMap.get(a.customerId) ?? ''
          const bName = customerNameMap.get(b.customerId) ?? ''
          cmp = aName.localeCompare(bName)
          break
        }
        case 'serviceType': {
          const aLabel = SERVICE_TYPE_LABELS[a.serviceType]
          const bLabel = SERVICE_TYPE_LABELS[b.serviceType]
          cmp = aLabel.localeCompare(bLabel)
          break
        }
        case 'quantity':
          cmp = a.quantity - b.quantity
          break
        case 'dueDate':
          cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          break
        case 'lane':
          cmp = LANE_ORDER[a.lane] - LANE_ORDER[b.lane]
          break
        case 'risk':
          cmp = RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]
          break
        case 'taskProgress': {
          const aProgress = computeTaskProgress(a.tasks)
          const bProgress = computeTaskProgress(b.tasks)
          cmp = aProgress.percentage - bProgress.percentage
          break
        }
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [
    jobs,
    searchQuery,
    laneFilter,
    serviceTypeFilter,
    riskFilter,
    sortKey,
    sortDir,
    customerNameMap,
  ])

  // ---- Check if any filters are active ------------------------------------

  const hasFilters =
    searchQuery.length > 0 ||
    laneFilter.length > 0 ||
    serviceTypeFilter.length > 0 ||
    riskFilter.length > 0

  // ---- Clear all filters helper -------------------------------------------

  const clearFilters = useCallback(() => {
    router.replace('?', { scroll: false })
    setLocalSearch('')
  }, [router])

  // ---- Filter options for ColumnHeaderMenu --------------------------------

  const laneFilterOptions = ALL_LANES.map((l) => ({
    value: l,
    label: LANE_LABELS[l],
  }))

  const serviceTypeFilterOptions = ALL_SERVICE_TYPES.map((st) => ({
    value: st,
    label: SERVICE_TYPE_LABELS[st],
  }))

  const riskFilterOptions = ALL_RISKS.map((r) => ({
    value: r,
    label: RISK_LABELS[r],
  }))

  // ---- Render -------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      {/* ---- Search bar ---- */}
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search job #, customer, title..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
            aria-label="Search jobs"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => setLocalSearch('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Mobile filter button */}
        <button
          type="button"
          onClick={() => setFilterSheetOpen(true)}
          className={cn(
            'inline-flex items-center justify-center rounded-md p-2 md:hidden',
            'min-h-(--mobile-touch-target) min-w-(--mobile-touch-target)',
            'text-muted-foreground hover:text-foreground transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            (laneFilter || serviceTypeFilter || riskFilter) && 'text-action'
          )}
          aria-label="Sort & Filter"
        >
          <SlidersHorizontal className="size-4" />
        </button>

        <div className="flex-1" />

        {/* Clear all filters */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* ---- Data Table (desktop) / Card List (mobile) ---- */}
      {filteredJobs.length > 0 ? (
        <>
          {/* Desktop table -- hidden below md */}
          <div className="hidden md:block rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Job #"
                      sortKey="jobNumber"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort('jobNumber', dir)}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Service Type"
                      sortKey="serviceType"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort('serviceType', dir)}
                      filterOptions={serviceTypeFilterOptions}
                      activeFilters={serviceTypeFilter ? [serviceTypeFilter] : []}
                      onFilterToggle={handleServiceTypeFilterToggle}
                      onFilterClear={handleServiceTypeFilterClear}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Customer"
                      sortKey="customer"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort('customer', dir)}
                    />
                  </TableHead>
                  <TableHead>Job Name</TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Qty"
                      sortKey="quantity"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort('quantity', dir)}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Due Date"
                      sortKey="dueDate"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort('dueDate', dir)}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Lane"
                      sortKey="lane"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort('lane', dir)}
                      filterOptions={laneFilterOptions}
                      activeFilters={laneFilter ? [laneFilter] : []}
                      onFilterToggle={handleLaneFilterToggle}
                      onFilterClear={handleLaneFilterClear}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Risk"
                      sortKey="risk"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort('risk', dir)}
                      filterOptions={riskFilterOptions}
                      activeFilters={riskFilter ? [riskFilter] : []}
                      onFilterToggle={handleRiskFilterToggle}
                      onFilterClear={handleRiskFilterClear}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Progress"
                      sortKey="taskProgress"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort('taskProgress', dir)}
                    />
                  </TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => {
                  const progress = computeTaskProgress(job.tasks)
                  return (
                    <TableRow
                      key={job.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          router.push(`/jobs/${job.id}`)
                        }
                      }}
                      aria-label={`View ${job.jobNumber}`}
                    >
                      <TableCell className="font-medium">
                        <span className="text-action hover:underline">{job.jobNumber}</span>
                      </TableCell>
                      <TableCell>
                        <ServiceTypeBadge serviceType={job.serviceType} variant="badge" />
                      </TableCell>
                      <TableCell className="text-sm">
                        {customerNameMap.get(job.customerId) ?? 'Unknown'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                        {job.title}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {job.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          {formatDate(job.dueDate)}
                          <RiskIndicator riskLevel={job.riskLevel} />
                        </span>
                      </TableCell>
                      <TableCell>
                        <LaneBadge lane={job.lane} />
                      </TableCell>
                      <TableCell>
                        <TaskProgressBar completed={progress.completed} total={progress.total} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                'inline-flex items-center justify-center rounded-sm p-1',
                                'text-muted-foreground hover:text-foreground transition-colors',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                              )}
                              aria-label={`Actions for ${job.jobNumber}`}
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}`)}>
                              <Eye className="size-4" />
                              View Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onMoveLane(job)}>
                              <ArrowRightLeft className="size-4" />
                              Move Lane
                            </DropdownMenuItem>
                            {job.lane === 'blocked' ? (
                              <DropdownMenuItem onClick={() => onUnblock(job)}>
                                <ShieldCheck className="size-4" />
                                Unblock
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => onBlock(job)}>
                                <ShieldAlert className="size-4" />
                                Mark Blocked
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list -- visible below md */}
          <div className="flex flex-col gap-(--mobile-card-gap) md:hidden">
            {filteredJobs.map((job) => {
              const progress = computeTaskProgress(job.tasks)
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className={cn(
                    'flex flex-col gap-2 rounded-lg border border-border bg-elevated p-4',
                    'text-left transition-colors hover:bg-muted/50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50'
                  )}
                >
                  {/* Top row: job # + customer */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-action">{job.jobNumber}</span>
                      <span className="text-sm text-muted-foreground">
                        {customerNameMap.get(job.customerId) ?? 'Unknown'}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <MoneyAmount
                        value={job.orderTotal}
                        format="compact"
                        className="text-sm font-medium"
                      />
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Package className="size-3" />
                        {job.quantity.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Middle row: badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ServiceTypeBadge serviceType={job.serviceType} variant="badge" />
                    <LaneBadge lane={job.lane} />
                  </div>

                  {/* Due date + risk */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      Due {formatDate(job.dueDate)}
                      <RiskIndicator riskLevel={job.riskLevel} />
                    </span>
                  </div>

                  {/* Task progress */}
                  <TaskProgressBar completed={progress.completed} total={progress.total} />
                </button>
              )
            })}
          </div>
        </>
      ) : (
        /* ---- Empty state ---- */
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16">
          <ENTITY_ICONS.job className="size-12 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-4 text-sm font-medium">
            {hasFilters ? 'No jobs match the current filters' : 'No jobs yet'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? 'Try adjusting or clearing your filters'
              : 'Jobs will appear here when quotes are accepted'}
          </p>
          {hasFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* ---- Result count ---- */}
      {filteredJobs.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
          {hasFilters && ' (filtered)'}
        </p>
      )}

      {/* ---- Mobile filter sheet ---- */}
      {filterSheetOpen && (
        <MobileFilterSheet
          open={filterSheetOpen}
          onOpenChange={setFilterSheetOpen}
          sortOptions={[
            { value: 'dueDate', label: 'Due Date' },
            { value: 'jobNumber', label: 'Job #' },
            { value: 'customer', label: 'Customer' },
            { value: 'lane', label: 'Lane' },
            { value: 'risk', label: 'Risk' },
            { value: 'taskProgress', label: 'Progress' },
          ]}
          currentSort={sortKey}
          onSortChange={(value) => handleSort(value as SortKey)}
          filterGroups={[
            {
              label: 'Lane',
              options: laneFilterOptions,
              selected: laneFilter ? [laneFilter] : [],
              onToggle: handleLaneFilterToggle,
            },
            {
              label: 'Service Type',
              options: serviceTypeFilterOptions,
              selected: serviceTypeFilter ? [serviceTypeFilter] : [],
              onToggle: handleServiceTypeFilterToggle,
            },
            {
              label: 'Risk',
              options: riskFilterOptions,
              selected: riskFilter ? [riskFilter] : [],
              onToggle: handleRiskFilterToggle,
            },
          ]}
          onApply={() => setFilterSheetOpen(false)}
          onReset={clearFilters}
        />
      )}
    </div>
  )
}

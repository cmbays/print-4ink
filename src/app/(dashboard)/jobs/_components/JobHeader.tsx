'use client'

import Link from 'next/link'
import { Calendar, Clock, CalendarPlus } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { ServiceTypeBadge } from '@/components/features/ServiceTypeBadge'
import { RiskIndicator } from '@/components/features/RiskIndicator'
import { LaneBadge } from '@/components/features/LaneBadge'
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  SERVICE_TYPE_LEFT_BORDER_COLORS,
} from '@domain/constants'
import { formatDate } from '@shared/lib/format'
import type { Job } from '@domain/entities/job'

type JobHeaderProps = {
  job: Job
  customerName: string
}

export function JobHeader({ job, customerName }: JobHeaderProps) {
  const leftBorderColor = SERVICE_TYPE_LEFT_BORDER_COLORS[job.serviceType]

  return (
    <section
      className={cn('rounded-lg border border-border bg-card p-5 border-l-[3px]', leftBorderColor)}
    >
      {/* Top row: service badge + job number */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ServiceTypeBadge serviceType={job.serviceType} variant="badge" />
          <span className="text-xs font-mono text-muted-foreground">{job.jobNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <RiskIndicator riskLevel={job.riskLevel} showLabel />
          <LaneBadge lane={job.lane} />
        </div>
      </div>

      {/* Customer name link */}
      <Link
        href={`/customers/${job.customerId}`}
        className="mt-2 block text-sm text-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50 rounded-sm"
      >
        {customerName}
      </Link>

      {/* Title */}
      <h1 className="mt-1 text-lg font-semibold text-foreground">{job.title}</h1>

      {/* Priority */}
      <span className={cn('mt-1 inline-block text-xs font-medium', PRIORITY_COLORS[job.priority])}>
        {PRIORITY_LABELS[job.priority]} Priority
      </span>

      {/* Date metadata row */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-3.5" />
          Due {formatDate(job.dueDate)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" />
          Start {formatDate(job.startDate)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarPlus className="size-3.5" />
          Created {formatDate(job.createdAt)}
        </span>
      </div>
    </section>
  )
}

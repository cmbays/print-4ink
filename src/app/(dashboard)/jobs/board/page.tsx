import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs, CRUMBS } from '@shared/lib/breadcrumbs'
import { getJobs, getQuoteCards, getScratchNotes } from '@infra/repositories/jobs'
import { ProductionBoard } from './_components/ProductionBoard'

export default async function ProductionBoardPage() {
  const [jobs, quoteCards, scratchNotes] = await Promise.all([
    getJobs(),
    getQuoteCards(),
    getScratchNotes(),
  ])

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.jobsBoard, { label: 'Board' })} />
      <ProductionBoard
        initialJobs={jobs}
        initialQuoteCards={quoteCards}
        initialScratchNotes={scratchNotes}
      />
    </>
  )
}

export default function QuoteDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb skeleton */}
      <div className="h-5 w-48 animate-pulse rounded bg-muted" />

      {/* Back link skeleton */}
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />

      {/* Header card skeleton */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>

      {/* Line items skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <div className="h-5 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Pricing skeleton */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-2">
        <div className="h-6 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

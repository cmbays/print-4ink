'use client'

import Link from 'next/link'
import {
  ChevronDown,
  FileText,
  Hammer,
  ScrollText,
  CreditCard,
  Bell,
  Send,
  Pencil,
} from 'lucide-react'
import { Badge } from '@shared/ui/primitives/badge'
import { Button } from '@shared/ui/primitives/button'
import { Separator } from '@shared/ui/primitives/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@shared/ui/primitives/collapsible'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/primitives/table'
import { StatusBadge } from '@/components/features/StatusBadge'
import { OverdueBadge } from '@/components/features/OverdueBadge'
import { BottomActionBar } from '@shared/ui/layouts/bottom-action-bar'
import { InvoiceActions } from './InvoiceActions'
import { PaymentLedger } from './PaymentLedger'
import { ReminderTimeline } from './ReminderTimeline'
import { ChangeDiffPanel } from './ChangeDiffPanel'
import { cn } from '@shared/lib/cn'
import {
  INVOICE_LINE_ITEM_TYPE_LABELS,
  PAYMENT_TERMS_LABELS,
  CREDIT_MEMO_REASON_LABELS,
} from '@domain/constants'
import { computeIsOverdue, isValidStatusTransition } from '@domain/rules/invoice.rules'
import { formatDate } from '@shared/lib/format'
import { money, toNumber, formatCurrency } from '@domain/lib/money'
import { toast } from 'sonner'
import type { Invoice, Payment } from '@domain/entities/invoice'
import type { Customer } from '@domain/entities/customer'
import type { CreditMemo } from '@domain/entities/credit-memo'

type InvoiceDetailViewProps = {
  invoice: Invoice
  customer: Customer | null
  payments: Payment[]
  creditMemos: CreditMemo[]
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const LINE_ITEM_TYPE_COLORS: Record<string, string> = {
  garment: 'bg-action/10 text-action border border-action/20',
  setup: 'bg-muted text-muted-foreground',
  artwork: 'bg-success/10 text-success border border-success/20',
  rush: 'bg-error/10 text-error border border-error/20',
  other: 'bg-muted text-muted-foreground',
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  created: 'Created',
  sent: 'Sent',
  payment_recorded: 'Payment Recorded',
  voided: 'Voided',
  edited: 'Edited',
  credit_memo_issued: 'Credit Memo Issued',
}

function getBalanceColor(invoice: Invoice): string {
  if (invoice.balanceDue <= 0) return 'text-success'
  if (invoice.status === 'partial') return 'text-warning'
  if (computeIsOverdue(invoice)) return 'text-error'
  return 'text-action'
}

export function InvoiceDetailView({
  invoice,
  customer,
  payments,
  creditMemos,
}: InvoiceDetailViewProps) {
  const totalDiscounts = toNumber(
    invoice.discounts.reduce((sum, d) => sum.plus(money(d.amount)), money(0))
  )

  // Status-aware action visibility (mirrors InvoiceActions logic)
  const { status } = invoice
  const canSend = status === 'draft' && isValidStatusTransition(status, 'sent')
  const canEdit = status === 'draft'
  const canRecordPayment = status === 'sent' || status === 'partial'
  const canSendReminder = status === 'sent' || status === 'partial'

  // Only show bottom bar when there are actionable buttons to display
  const hasActions = canEdit || canSend || canRecordPayment || canSendReminder
  const showBottomBar = hasActions

  return (
    <div className={cn('space-y-6', showBottomBar && 'pb-20 md:pb-0')}>
      {/* 1. Header */}
      <div className="sticky top-0 z-10 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">{invoice.invoiceNumber}</h1>
            <StatusBadge status={invoice.status} variant="invoice" />
            <OverdueBadge
              dueDate={invoice.dueDate}
              balanceDue={invoice.balanceDue}
              status={invoice.status}
            />
          </div>
          <InvoiceActions invoice={invoice} customer={customer} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Created {formatDate(invoice.createdAt)}
          {invoice.sentAt && <span> · Sent {formatDate(invoice.sentAt)}</span>}
          {invoice.paidAt && <span> · Paid {formatDate(invoice.paidAt)}</span>}
          <span>
            {' '}
            ·{' '}
            {PAYMENT_TERMS_LABELS[invoice.paymentTerms as keyof typeof PAYMENT_TERMS_LABELS] ??
              invoice.paymentTerms}
          </span>
          <span> · Due {formatDate(invoice.dueDate)}</span>
        </p>
      </div>

      {/* 2. Customer & Source */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-base font-semibold text-foreground">Customer & Source</h3>
        <div className="mt-3 space-y-2">
          {customer ? (
            <div>
              <Link
                href={`/customers/${customer.id}`}
                className="text-sm font-medium text-foreground hover:text-action transition-colors"
              >
                {customer.name} — {customer.company}
              </Link>
              <p className="text-sm text-muted-foreground">
                {customer.email} · {customer.phone}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Customer not found</p>
          )}
          {invoice.quoteId && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">From quote:</span>
              <Link href={`/quotes/${invoice.quoteId}`} className="text-action hover:underline">
                View Quote
              </Link>
            </div>
          )}
          {invoice.jobId && (
            <div className="flex items-center gap-2 text-sm">
              <Hammer className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Linked job:</span>
              <Link href={`/jobs/${invoice.jobId}`} className="text-action hover:underline">
                View Job
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 3. Line Items */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Line Items</h3>
          <Badge variant="ghost" className="bg-muted text-muted-foreground text-xs capitalize">
            {invoice.itemizationMode}
          </Badge>
        </div>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge
                      variant="ghost"
                      className={cn(
                        'text-xs',
                        LINE_ITEM_TYPE_COLORS[item.type] ?? LINE_ITEM_TYPE_COLORS.other
                      )}
                    >
                      {INVOICE_LINE_ITEM_TYPE_LABELS[item.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">{item.description}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-foreground">
                    {formatCurrency(item.lineTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 4. Pricing Summary */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-2">
        <h3 className="text-base font-semibold text-foreground">Pricing</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground font-mono">{formatCurrency(invoice.subtotal)}</span>
          </div>

          {invoice.discounts.map((discount, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-muted-foreground">{discount.label}</span>
              <span className="text-success font-mono">−{formatCurrency(discount.amount)}</span>
            </div>
          ))}

          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            {invoice.shipping === 0 ? (
              <Badge variant="ghost" className="bg-success/10 text-success text-xs">
                FREE
              </Badge>
            ) : (
              <span className="text-foreground font-mono">{formatCurrency(invoice.shipping)}</span>
            )}
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
            <span className="text-foreground font-mono">{formatCurrency(invoice.taxAmount)}</span>
          </div>

          <Separator className="my-2" />

          <div className="flex justify-between text-base font-semibold">
            <span className="text-foreground">Total</span>
            <span className="text-foreground font-mono">{formatCurrency(invoice.total)}</span>
          </div>

          {totalDiscounts > 0 && (
            <div className="mt-2 rounded-md bg-success/10 px-3 py-2 text-center">
              <span className="text-sm font-medium text-success">
                Saved {formatCurrency(totalDiscounts)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Change Tracking */}
      <ChangeDiffPanel
        pricingSnapshot={invoice.pricingSnapshot}
        currentPricing={{
          subtotal: invoice.subtotal,
          discountTotal: invoice.discountTotal,
          shipping: invoice.shipping,
          taxAmount: invoice.taxAmount,
          total: invoice.total,
        }}
      />

      {/* 6. Balance Due */}
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Balance Due</p>
        <p className={cn('mt-1 text-3xl font-semibold font-mono', getBalanceColor(invoice))}>
          {formatCurrency(invoice.balanceDue)}
        </p>
        {invoice.depositRequested && invoice.status === 'draft' && (
          <p className="mt-2 text-sm text-muted-foreground">
            Deposit requested: {formatCurrency(invoice.depositRequested)}
          </p>
        )}
        {invoice.amountPaid > 0 && invoice.balanceDue > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCurrency(invoice.amountPaid)} paid of {formatCurrency(invoice.total)}
          </p>
        )}
      </div>

      {/* 7. Payment Ledger */}
      <PaymentLedger payments={payments} total={invoice.amountPaid} />

      {/* 8. Credit Memos */}
      {creditMemos.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-base font-semibold text-foreground">Credit Memos</h3>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditMemos.map((cm) => (
                  <TableRow key={cm.id}>
                    <TableCell className="font-medium text-foreground">
                      {cm.creditMemoNumber}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="ghost"
                        className="bg-warning/10 text-warning border border-warning/20 text-xs"
                      >
                        {CREDIT_MEMO_REASON_LABELS[cm.reason]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-error">
                      −{formatCurrency(cm.totalCredit)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(cm.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 9. Reminder Timeline */}
      <ReminderTimeline reminders={invoice.reminders} />

      {/* 10. Audit Log */}
      <div className="rounded-lg border border-border bg-card">
        <Collapsible>
          <CollapsibleTrigger className="group flex w-full items-center justify-between p-4 text-sm font-medium text-foreground hover:bg-surface transition-colors rounded-lg">
            <div className="flex items-center gap-2">
              <ScrollText className="size-4 text-muted-foreground" />
              <span>Audit Log ({invoice.auditLog.length})</span>
            </div>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...invoice.auditLog]
                    .sort(
                      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    )
                    .map((entry, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-foreground">
                          {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{entry.performedBy}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(entry.timestamp)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.details ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* 11. Notes */}
      {(invoice.internalNotes || invoice.customerNotes) && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Notes</h3>
          {invoice.internalNotes && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Internal
              </p>
              <p className="text-sm text-foreground">{invoice.internalNotes}</p>
            </div>
          )}
          {invoice.customerNotes && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Customer
              </p>
              <p className="text-sm text-foreground">{invoice.customerNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Mobile BottomActionBar — status-aware actions */}
      {showBottomBar && (
        <BottomActionBar>
          {/* Draft: Edit + Send */}
          {canEdit && (
            <Button variant="outline" className="flex-1 min-h-(--mobile-touch-target)" asChild>
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
          )}
          {canSend && (
            <Button
              variant="outline"
              className="flex-1 min-h-(--mobile-touch-target)"
              onClick={() => {
                toast.success(
                  `Invoice ${invoice.invoiceNumber} sent to ${customer?.email ?? 'customer'}`
                )
              }}
            >
              <Send className="size-4" />
              Send
            </Button>
          )}

          {/* Sent / Partial / Overdue: Record Payment + Send Reminder */}
          {canRecordPayment && (
            <Button
              variant="outline"
              className="flex-1 min-h-(--mobile-touch-target)"
              onClick={() => {
                toast.info('Record Payment dialog coming in Phase 2')
              }}
            >
              <CreditCard className="size-4" />
              Record Payment
            </Button>
          )}
          {canSendReminder && (
            <Button
              variant="outline"
              className="flex-1 min-h-(--mobile-touch-target)"
              onClick={() => {
                toast.success(`Reminder sent for ${invoice.invoiceNumber}`)
              }}
            >
              <Bell className="size-4" />
              Send Reminder
            </Button>
          )}
        </BottomActionBar>
      )}
    </div>
  )
}

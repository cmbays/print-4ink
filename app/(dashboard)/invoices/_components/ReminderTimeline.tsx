import type { Reminder } from "@/lib/schemas/invoice";
import { Bell } from "lucide-react";

interface ReminderTimelineProps {
  reminders: Reminder[];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ReminderTimeline({ reminders }: ReminderTimelineProps) {
  if (reminders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-base font-semibold text-foreground">Reminders</h3>
        <div className="mt-4 flex flex-col items-center gap-2 py-6 text-center">
          <Bell className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No reminders sent</p>
        </div>
      </div>
    );
  }

  // Sort newest first
  const sorted = [...reminders].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  );

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-base font-semibold text-foreground">Reminders</h3>
      <div className="mt-4 space-y-0">
        {sorted.map((reminder, index) => (
          <div key={reminder.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical line */}
            {index < sorted.length - 1 && (
              <div className="absolute left-[9px] top-5 bottom-0 w-px bg-border" />
            )}
            {/* Dot */}
            <div className="relative z-10 mt-1 flex size-[18px] shrink-0 items-center justify-center rounded-full border border-border bg-surface">
              <div className="size-2 rounded-full bg-action" />
            </div>
            {/* Content */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {formatDate(reminder.sentAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                Sent to {reminder.sentTo}
              </p>
              {reminder.message && (
                <p className="text-sm text-muted-foreground">
                  {reminder.message}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

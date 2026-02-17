"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@shared/ui/primitives/checkbox";
import { formatDate } from "@/lib/helpers/format";
import type { JobTask } from "@domain/entities/job";

interface TaskItemProps {
  task: JobTask;
  onToggle: (taskId: string) => void;
}

export function TaskItem({ task, onToggle }: TaskItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors",
        "hover:bg-surface/50"
      )}
    >
      <Checkbox
        id={`task-${task.id}`}
        checked={task.isCompleted}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-0.5 shrink-0"
        aria-label={`Mark "${task.label}" as ${task.isCompleted ? "incomplete" : "complete"}`}
      />
      <label
        htmlFor={`task-${task.id}`}
        className="flex-1 cursor-pointer select-none"
      >
        <span
          className={cn(
            "block text-sm",
            task.isCompleted
              ? "text-muted-foreground line-through"
              : "text-foreground"
          )}
        >
          {task.label}
        </span>
        {task.detail && (
          <span
            className={cn(
              "mt-0.5 block text-xs text-muted-foreground",
              task.isCompleted && "line-through"
            )}
          >
            {task.detail}
          </span>
        )}
        {task.isCompleted && task.completedAt && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Completed {formatDate(task.completedAt)}
          </span>
        )}
      </label>
    </div>
  );
}

"use client";

import { useState } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@shared/ui/primitives/button";
import { TaskProgressBar } from "@/components/features/TaskProgressBar";
import { TaskItem } from "./TaskItem";
import { AddCustomTaskInput } from "./AddCustomTaskInput";
import { computeTaskProgress } from "@domain/rules/job.rules";
import type { JobTask } from "@domain/entities/job";

interface TaskChecklistProps {
  tasks: JobTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (label: string, detail?: string) => void;
}

export function TaskChecklist({
  tasks,
  onToggleTask,
  onAddTask,
}: TaskChecklistProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const progress = computeTaskProgress(tasks);
  const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);

  function handleAddTask(label: string, detail?: string) {
    onAddTask(label, detail);
    setShowAddForm(false);
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Tasks
        </h2>
        <TaskProgressBar
          completed={progress.completed}
          total={progress.total}
        />
      </div>

      {/* All complete indicator */}
      {progress.allComplete && progress.total > 0 && (
        <div className="flex items-center gap-2 border-b border-success/20 bg-success/5 px-4 py-2.5">
          <CheckCircle2 className="size-4 text-success" />
          <span className="text-sm font-medium text-success">
            All tasks complete — ready for next lane
          </span>
        </div>
      )}

      {/* Task list */}
      <div className="divide-y divide-border/30 px-1">
        {sortedTasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={onToggleTask} />
        ))}
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No tasks yet. Add a custom task to get started.
        </div>
      )}

      {/* Add custom task */}
      <div className={cn("border-t border-border px-4 py-3")}>
        {showAddForm ? (
          <AddCustomTaskInput
            onAdd={handleAddTask}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="size-3.5" />
            Add Custom Task
          </Button>
        )}
      </div>
    </section>
  );
}

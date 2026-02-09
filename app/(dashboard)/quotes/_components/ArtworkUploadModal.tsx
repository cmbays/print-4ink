"use client";

import { useState } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ARTWORK_TAG_LABELS } from "@/lib/constants";
import type { ArtworkTag } from "@/lib/schemas/artwork";

interface ArtworkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onSave: (artwork: {
    name: string;
    colorCount: number;
    tags: ArtworkTag[];
    saveToLibrary: boolean;
  }) => void;
}

const ALL_TAGS: ArtworkTag[] = ["corporate", "event", "seasonal", "promotional", "sports", "custom"];

export function ArtworkUploadModal({
  open,
  onOpenChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- will be used in Phase 2 for server-side save
  customerId,
  onSave,
}: ArtworkUploadModalProps) {
  const [name, setName] = useState("");
  const [colorCount, setColorCount] = useState(1);
  const [selectedTags, setSelectedTags] = useState<ArtworkTag[]>([]);
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [errors, setErrors] = useState<{ name?: string }>({});

  function reset() {
    setName("");
    setColorCount(1);
    setSelectedTags([]);
    setSaveToLibrary(true);
    setErrors({});
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  function handleToggleTag(tag: ArtworkTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSave() {
    if (!name.trim()) {
      setErrors({ name: "Artwork name is required" });
      return;
    }
    onSave({
      name: name.trim(),
      colorCount,
      tags: selectedTags,
      saveToLibrary,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload size={18} />
            Upload Artwork
          </DialogTitle>
          <DialogDescription>
            Add artwork to this quote. You can optionally save it to the customer library.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File dropzone (mock) */}
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6">
            <ImageIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Artwork upload simulated for Phase 1</p>
            <p className="text-xs text-muted-foreground">A placeholder will be generated</p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="artwork-name">
              Name <span className="text-error">*</span>
            </Label>
            <Input
              id="artwork-name"
              placeholder="e.g., Company Logo — Full Color"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({});
              }}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-xs text-error">{errors.name}</p>}
          </div>

          {/* Color count */}
          <div className="space-y-1.5">
            <Label htmlFor="artwork-colors">Number of Colors</Label>
            <Input
              id="artwork-colors"
              type="number"
              min={1}
              max={12}
              value={colorCount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setColorCount(isNaN(val) ? 1 : Math.max(1, Math.min(12, val)));
              }}
              className="w-20"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant="ghost"
                  className={cn(
                    "cursor-pointer text-xs",
                    selectedTags.includes(tag)
                      ? "bg-action/10 text-action border border-action/20"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleToggleTag(tag)}
                >
                  {ARTWORK_TAG_LABELS[tag]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Save to library */}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={saveToLibrary}
              onCheckedChange={(checked) => setSaveToLibrary(checked === true)}
            />
            Save to customer library
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Add Artwork</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

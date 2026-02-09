"use client";

import Image from "next/image";
import { Check, ChevronsUpDown, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState } from "react";
import type { Artwork } from "@/lib/schemas/artwork";

interface ArtworkAssignmentPickerProps {
  artworks: Artwork[];
  selectedArtworkId?: string;
  onSelect: (artworkId: string | undefined) => void;
}

export function ArtworkAssignmentPicker({
  artworks,
  selectedArtworkId,
  onSelect,
}: ArtworkAssignmentPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = artworks.find((a) => a.id === selectedArtworkId);

  if (artworks.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">No artwork selected</span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs px-2"
        >
          {selected ? (
            <>
              <Image
                src={selected.thumbnailUrl}
                alt=""
                width={16}
                height={16}
                className="size-4 rounded-sm object-contain bg-muted"
              />
              <span className="truncate max-w-[100px]">{selected.name}</span>
            </>
          ) : (
            <>
              <ImageIcon size={12} className="text-muted-foreground" />
              <span className="text-muted-foreground">Assign Artwork</span>
            </>
          )}
          <ChevronsUpDown size={12} className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No artwork available.</CommandEmpty>
            <CommandGroup>
              {artworks.map((artwork) => (
                <CommandItem
                  key={artwork.id}
                  value={artwork.id}
                  onSelect={(value) => {
                    onSelect(value === selectedArtworkId ? undefined : value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-3",
                      selectedArtworkId === artwork.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Image
                    src={artwork.thumbnailUrl}
                    alt=""
                    width={20}
                    height={20}
                    className="mr-2 size-5 rounded-sm object-contain bg-muted"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs truncate">{artwork.name}</span>
                    <span className="text-xs text-muted-foreground">{artwork.colorCount} colors</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

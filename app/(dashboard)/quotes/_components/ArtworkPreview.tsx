import Image from "next/image";

interface ArtworkPreviewProps {
  garmentColor: string;
  artworkThumbnailUrl?: string;
  artworkName?: string;
  location: string;
}

export function ArtworkPreview({
  garmentColor,
  artworkThumbnailUrl,
  artworkName,
  location,
}: ArtworkPreviewProps) {
  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <div
        className="flex size-12 items-center justify-center rounded border border-border"
        style={{ backgroundColor: garmentColor }}
      >
        {artworkThumbnailUrl ? (
          <div className="flex size-9 items-center justify-center rounded-sm bg-white/90">
            <Image
              src={artworkThumbnailUrl}
              alt={artworkName || `${location} artwork`}
              width={28}
              height={28}
              className="size-7 object-contain"
            />
          </div>
        ) : (
          <span className="text-[8px] text-white/50">{location}</span>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground">{location}</span>
    </div>
  );
}

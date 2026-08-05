"use client";

import { useRef } from "react";
import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface UploadedPhoto {
  id: string;
  url: string;
}

interface PhotoUploadProps {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  maxPhotos?: number;
  className?: string;
}

export function PhotoUpload({ photos, onChange, maxPhotos = 6, className }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;

    const remainingSlots = maxPhotos - photos.length;
    const newPhotos = Array.from(fileList)
      .slice(0, remainingSlots)
      .map((file) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(file) }));

    if (newPhotos.length > 0) onChange([...photos, ...newPhotos]);
  }

  function handleRemove(id: string) {
    const target = photos.find((photo) => photo.id === id);
    if (target?.url.startsWith("blob:")) URL.revokeObjectURL(target.url);
    onChange(photos.filter((photo) => photo.id !== id));
  }

  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {Array.from({ length: maxPhotos }).map((_, index) => {
        const photo = photos[index];

        if (photo) {
          return (
            <div
              key={photo.id}
              className="border-border relative aspect-square overflow-hidden rounded-xl border"
            >
              <img src={photo.url} alt="" className="size-full object-cover" />
              {index === 0 && (
                <Badge className="absolute top-1.5 left-1.5 bg-black/60 text-white">Capa</Badge>
              )}
              <button
                type="button"
                onClick={() => handleRemove(photo.id)}
                aria-label="Remover foto"
                className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        }

        return (
          <button
            key={index}
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Adicionar foto"
            className="border-border bg-muted/50 text-muted-foreground hover:border-primary hover:text-primary flex aspect-square items-center justify-center rounded-xl border border-dashed transition-colors"
          >
            <Plus className="size-5" />
          </button>
        );
      })}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

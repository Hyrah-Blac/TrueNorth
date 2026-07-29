"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { IAircraftImage } from "@/types/aircraft";

interface GalleryLightboxProps {
  images: IAircraftImage[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  aircraftName: string;
}

export function GalleryLightbox({ images, activeIndex, onIndexChange, onClose, aircraftName }: GalleryLightboxProps) {
  const goPrev = useCallback(() => {
    onIndexChange((activeIndex - 1 + images.length) % images.length);
  }, [activeIndex, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((activeIndex + 1) % images.length);
  }, [activeIndex, images.length, onIndexChange]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [goPrev, goNext, onClose]);

  const current = images[activeIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${aircraftName} photo gallery, fullscreen`}
      className="fixed inset-0 z-[100] flex flex-col bg-navy-950/97 backdrop-blur-md"
    >
      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        <p className="text-xs text-white/60">
          {activeIndex + 1} / {images.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-colors duration-300 hover:border-sky-400 hover:bg-white/10"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-6 sm:px-10">
        {images.length > 1 ? (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 text-white transition-all duration-300 hover:border-sky-400 hover:bg-white/10 sm:left-6"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}

        <div key={activeIndex} className="relative h-full w-full max-w-5xl">
          {current ? (
            <Image
              src={current.url}
              alt={current.caption ?? aircraftName}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          ) : null}
        </div>

        {images.length > 1 ? (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 text-white transition-all duration-300 hover:border-sky-400 hover:bg-white/10 sm:right-6"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {current?.caption ? (
        <p className="pb-6 text-center text-sm text-white/60">{current.caption}</p>
      ) : null}

      {images.length > 1 ? (
        <div className="flex justify-center gap-2 overflow-x-auto pb-6">
          {images.map((image, index) => (
            <button
              key={image.publicId}
              type="button"
              onClick={() => onIndexChange(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={index === activeIndex}
              className={`relative h-12 w-18 shrink-0 overflow-hidden rounded-md border-2 transition-all duration-300 ${
                index === activeIndex ? "border-sky-400" : "border-transparent opacity-50 hover:opacity-90"
              }`}
              style={{ width: "4.5rem" }}
            >
              <Image src={image.url} alt="" fill className="object-cover" sizes="72px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
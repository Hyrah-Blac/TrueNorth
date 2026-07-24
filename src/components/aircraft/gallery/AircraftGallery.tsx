"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff, Maximize2 } from "lucide-react";
import { Skeleton } from "@/components/shared/skeleton/Skeleton";
import { GalleryLightbox } from "./GalleryLightbox";
import type { IAircraftImage } from "@/types/aircraft";

interface GalleryTab {
  key: "exterior" | "interior" | "cabin";
  label: string;
  images: IAircraftImage[];
}

export function AircraftGallery({
  aircraftName,
  exteriorImages,
  interiorImages,
  cabinImages,
}: {
  aircraftName: string;
  exteriorImages: IAircraftImage[];
  interiorImages: IAircraftImage[];
  cabinImages: IAircraftImage[];
}) {
  const tabs: GalleryTab[] = (
    [
      { key: "exterior", label: "Exterior", images: exteriorImages },
      { key: "interior", label: "Interior", images: interiorImages },
      { key: "cabin", label: "Cabin", images: cabinImages },
    ] satisfies GalleryTab[]
  ).filter((tab) => tab.images.length > 0);

  const [activeTab, setActiveTab] = useState<GalleryTab["key"]>(tabs[0]?.key ?? "exterior");
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loadedKeys, setLoadedKeys] = useState<Set<string>>(new Set());

  const currentTab = tabs.find((tab) => tab.key === activeTab);
  const currentImage = currentTab?.images[activeImage];
  const mainImageLoaded = currentImage ? loadedKeys.has(currentImage.publicId) : false;

  function markLoaded(key: string) {
    setLoadedKeys((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }

  if (tabs.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-navy-900 to-navy-950 text-slate-400">
        <ImageOff className="h-8 w-8" aria-hidden="true" />
        <p className="text-sm">Photography coming soon</p>
      </div>
    );
  }

  return (
    <div>
      <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-navy-950">
        {!mainImageLoaded ? <Skeleton className="absolute inset-0 h-full w-full rounded-xl" /> : null}

        {currentTab?.images.map((image, index) => (
          <div
            key={image.publicId}
            className={`absolute inset-0 transition-opacity duration-700 ease-editorial ${
              index === activeImage ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={index !== activeImage}
          >
            <Image
              src={image.url}
              alt={image.caption ?? `${aircraftName} photo`}
              fill
              className="object-cover transition-transform duration-[1400ms] ease-editorial group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 60vw, 100vw"
              priority={index === 0}
              onLoad={() => markLoaded(image.publicId)}
            />
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/30 via-transparent to-transparent" />

        {currentImage ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="View fullscreen gallery"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-navy-900 opacity-0 backdrop-blur-sm transition-all duration-300 ease-editorial hover:bg-sky-500 hover:text-navy-950 group-hover:opacity-100"
          >
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}

        {currentTab && currentTab.images.length > 1 ? (
          <p className="spec-readout absolute bottom-4 right-4 z-10 rounded-full bg-navy-950/60 px-3 py-1 text-[11px] text-white/80 backdrop-blur-sm">
            {activeImage + 1} / {currentTab.images.length}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setActiveImage(0);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ease-editorial ${
                activeTab === tab.key
                  ? "bg-navy-900 text-white shadow-soft"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              <span className="spec-readout ml-1.5 text-[10px] opacity-60">{tab.images.length}</span>
            </button>
          ))}
        </div>
      </div>

      {currentTab && currentTab.images.length > 1 ? (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {currentTab.images.map((image, index) => (
            <button
              key={image.publicId}
              type="button"
              onClick={() => setActiveImage(index)}
              aria-label={`View image ${index + 1} of ${currentTab.images.length}`}
              aria-current={index === activeImage}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all duration-300 ease-editorial ${
                index === activeImage
                  ? "border-sky-500 shadow-soft"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={image.url} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      ) : null}

      {lightboxOpen && currentTab ? (
        <GalleryLightbox
          images={currentTab.images}
          activeIndex={activeImage}
          onIndexChange={setActiveImage}
          onClose={() => setLightboxOpen(false)}
          aircraftName={aircraftName}
        />
      ) : null}
    </div>
  );
}

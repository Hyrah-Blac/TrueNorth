"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { Skeleton } from "@/components/shared/skeleton/Skeleton";
import type { IAircraftImage } from "@/types/aircraft";

interface GalleryTab {
  key: "exterior" | "interior" | "cabin";
  label: string;
  images: IAircraftImage[];
}

// Aircraft photography is naturally wide (a side-profile shot loses a lot
// when squeezed narrow), but a fixed wide ratio crops too aggressively on
// phones. Stepping the ratio up by breakpoint keeps the framing sensible
// at every width instead of picking one compromise for all of them.
const GALLERY_ASPECT = "aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9]";

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
  const [loadedKeys, setLoadedKeys] = useState<Set<string>>(new Set());

  const currentTab = tabs.find((tab) => tab.key === activeTab);
  const currentImage = currentTab?.images[activeImage];
  const mainImageLoaded = currentImage ? loadedKeys.has(currentImage.publicId) : false;

  function markLoaded(key: string) {
    setLoadedKeys((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }

  if (tabs.length === 0) {
    return (
      <div
        className={`flex ${GALLERY_ASPECT} w-full flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-navy-900 to-navy-950 text-slate-400`}
      >
        <ImageOff className="h-8 w-8" aria-hidden="true" />
        <p className="text-sm">Photography coming soon</p>
      </div>
    );
  }

  return (
    <div>
      <div className={`group relative ${GALLERY_ASPECT} w-full overflow-hidden rounded-xl bg-navy-950`}>
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
              className="object-cover object-center"
              sizes="(min-width: 1024px) 60vw, 100vw"
              priority={index === 0}
              onLoad={() => markLoaded(image.publicId)}
            />
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/30 via-transparent to-transparent" />

        {currentTab && currentTab.images.length > 1 ? (
          <p className="absolute bottom-4 right-4 z-10 rounded-full bg-navy-950/60 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
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
              <span className="ml-1.5 text-[10px] opacity-60">{tab.images.length}</span>
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
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all duration-300 ease-editorial sm:h-16 sm:w-24 ${
                index === activeImage
                  ? "border-navy-900 shadow-soft"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={image.url} alt="" fill className="object-cover object-center" sizes="96px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
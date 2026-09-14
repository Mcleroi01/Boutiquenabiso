"use client";

import Image from "next/image";
import {
  Factory,
  PackageSearch,
  Recycle,
  Shirt,
  ShoppingBasket,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Platform = {
  name: string;
  description: string;
  accent: string;
  icon: React.ElementType;
  image: string;
};

const platforms: Platform[] = [
  {
    name: "Pinduoduo",
    description: "Promos, accessoires et lots populaires",
    accent: "from-rose-500 to-orange-500",
    icon: ShoppingBasket,
    image: "/platforms/images.png",
  },
  {
    name: "Xianyu",
    description: "Bonnes affaires et produits reconditionnés",
    accent: "from-cyan-500 to-teal-500",
    icon: Recycle,
    image: "/platforms/xianyu.webp",
  },
  {
    name: "1688",
    description: "Fournisseurs, gros et prix usine",
    accent: "from-orange-500 to-amber-500",
    icon: Factory,
    image: "/platforms/1688.webp",
  },
  {
    name: "Alibaba",
    description: "Sourcing international et commandes B2B",
    accent: "from-amber-500 to-red-500",
    icon: PackageSearch,
    image: "/platforms/Alibaba.png",
  },
  {
    name: "Shein",
    description: "Mode, vêtements et tendances",
    accent: "from-slate-800 to-slate-600",
    icon: Shirt,
    image: "/platforms/Shein.webp",
  },
];

export function PlatformMark({ platform }: { platform: Platform }) {
  const Icon = platform.icon;

  return (
    <div className="group brand-surface flex h-full items-center gap-3 rounded-2xl p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-slate-900/10">
      <div
        className={cn(
          "relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br",
          platform.accent,
        )}
      >
        <Image
          src={platform.image}
          alt={`Logo ${platform.name}`}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-bold">{platform.name}</p>
          <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
        </div>

        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {platform.description}
        </p>
      </div>
    </div>
  );
}

export function PlatformsSection({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "" : "container-page py-10 md:py-12"}>
      {!compact && (
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Nos plateformes
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Achat en Chine, livraison à Kinshasa
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Retrouvez les principales plateformes utilisées pour vos commandes.
          </p>
        </div>
      )}

      <div
        className={cn(
          "grid gap-3",
          compact
            ? "grid-cols-1 sm:grid-cols-2"
            : "sm:grid-cols-2 lg:grid-cols-5",
        )}
      >
        {platforms.map((platform) => (
          <PlatformMark key={platform.name} platform={platform} />
        ))}
      </div>
    </section>
  );
}

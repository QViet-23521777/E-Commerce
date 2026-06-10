import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface CategoryChipProps {
  label: string;
  slug: string;
  Icon: LucideIcon;
}

export default function CategoryChip({ label, slug, Icon }: CategoryChipProps) {
  return (
    <Link
      href={`/search?category=${slug}`}
      className="flex flex-col items-center gap-2.5 group flex-shrink-0"
    >
      <div className="w-16 h-16 rounded-full border-2 border-deep-navy bg-white flex items-center justify-center group-hover:border-primary-container group-hover:bg-surface-container-low transition-all duration-200">
        <Icon
          className="w-6 h-6 text-deep-navy group-hover:text-primary transition-colors duration-200"
          strokeWidth={1.5}
        />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-deep-navy transition-colors duration-200 text-center leading-tight max-w-[64px]">
        {label}
      </span>
    </Link>
  );
}

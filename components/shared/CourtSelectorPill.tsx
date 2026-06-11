"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CourtOption } from "@/lib/admin/courts";

type CourtSelectorPillProps = {
  label: string;
  options?: CourtOption[];
  includeAll?: boolean;
};

const CourtSelectorPill = ({
  label,
  options = [],
  includeAll = false,
}: CourtSelectorPillProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasOptions = includeAll || options.length > 0;

  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        disabled={!hasOptions}
        onClick={() => {
          setIsOpen((current) => {
            return !current;
          });
        }}
        className="flex h-9 w-full min-w-0 items-center justify-between rounded-full bg-white px-[14px] text-[15px] font-semibold text-[var(--color-text)] shadow-[0_8px_24px_rgba(29,137,228,0.08)] disabled:cursor-default"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Image src="/icons/empty-players.svg" alt="" width={30} height={30} />
          <span className="truncate">{label}</span>
        </span>
        <span className="ml-3 size-[8px] rotate-45 border-b-2 border-r-2 border-[var(--color-primary)]" />
      </button>

      {isOpen && hasOptions ? (
        <div className="absolute left-0 right-0 top-[44px] z-40 overflow-hidden rounded-[14px] border border-[#E6E6E6] bg-white shadow-[0_14px_34px_rgba(29,137,228,0.14)]">
          {includeAll ? (
            <Link
              href="/admin"
              className="flex h-11 items-center gap-2 px-4 text-[15px] font-semibold text-[var(--color-text)]"
            >
              <Image src="/icons/empty-players.svg" alt="" width={24} height={24} />
              สนามทั้งหมด
            </Link>
          ) : null}
          {options.map((option) => {
            return (
              <Link
                key={option.id}
                href={`/admin/courts/${option.id}`}
                className="flex h-11 items-center gap-2 border-t border-[#F2F2F2] px-4 text-[15px] font-semibold text-[var(--color-text)] first:border-t-0"
              >
                <Image src="/icons/empty-players.svg" alt="" width={24} height={24} />
                {option.name}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default CourtSelectorPill;

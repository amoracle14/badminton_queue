import Image from "next/image";

type CourtSelectorPillProps = {
  label: string;
};

export default function CourtSelectorPill({ label }: CourtSelectorPillProps) {
  return (
    <button
      type="button"
      className="flex h-9 min-w-0 flex-1 items-center justify-between rounded-full bg-white px-[14px] text-[15px] font-semibold text-[#3E3E3E] shadow-[0_8px_24px_rgba(64,169,255,0.08)]"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Image src="/icons/empty-players.svg" alt="" width={30} height={30} />
        <span className="truncate">{label}</span>
      </span>
      <span className="ml-3 size-[8px] rotate-45 border-b-2 border-r-2 border-[#1597F5]" />
    </button>
  );
}

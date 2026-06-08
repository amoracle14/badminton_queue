import CourtSelectorPill from "@/components/shared/CourtSelectorPill";
import IconButton from "@/components/shared/IconButton";

type TopCourtBarProps = {
  label: string;
  showBack?: boolean;
  detailMode?: boolean;
};

export default function TopCourtBar({
  label,
  showBack = false,
  detailMode = false,
}: TopCourtBarProps) {
  return (
    <div className="flex h-12 items-center gap-[14px] px-4">
      {showBack ? (
        <IconButton alt="ย้อนกลับ" href="/">
          <span className="size-[11px] -rotate-45 border-l-2 border-t-2 border-[#1597F5]" />
        </IconButton>
      ) : null}
      <CourtSelectorPill label={label} />
      {detailMode ? (
        <IconButton alt="สนาม" icon="/icons/court.svg" />
      ) : (
        <IconButton alt="QR Code" icon="/icons/qr-code.svg" />
      )}
      <IconButton alt="ตั้งค่า" icon="/icons/settings-sliders.svg" />
      <IconButton alt="สนาม" icon="/icons/court.svg" />
    </div>
  );
}

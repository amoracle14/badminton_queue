import CourtSelectorPill from "@/components/shared/CourtSelectorPill";
import IconButton from "@/components/shared/IconButton";
import type { CourtOption } from "@/lib/admin/courts";

type TopCourtBarProps = {
  label: string;
  showBack?: boolean;
  detailMode?: boolean;
  courtOptions?: CourtOption[];
  includeAllOption?: boolean;
};

const TopCourtBar = ({
  label,
  showBack = false,
  detailMode = false,
  courtOptions = [],
  includeAllOption = false,
}: TopCourtBarProps) => {
  return (
    <div className="flex h-12 items-center gap-[14px] px-4">
      {showBack ? (
        <IconButton
          alt="ย้อนกลับ"
          href="/admin"
          icon="/icons/angle-left-detail.svg"
        />
      ) : null}
      <CourtSelectorPill
        label={label}
        options={courtOptions}
        includeAll={includeAllOption}
      />
      {detailMode ? (
        <IconButton alt="เอกสาร" icon="/icons/document-detail.svg" />
      ) : (
        <IconButton alt="QR Code" icon="/icons/qr-code.svg" />
      )}
      <IconButton alt="ตั้งค่า" icon="/icons/settings-sliders.svg" />
      <IconButton alt="สนาม" icon="/icons/court.svg" />
    </div>
  );
};

export default TopCourtBar;

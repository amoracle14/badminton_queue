import CourtSelectorPill from "@/components/shared/CourtSelectorPill";
import IconButton from "@/components/shared/IconButton";

type TopCourtBarProps = {
  label: string;
  showBack?: boolean;
  detailMode?: boolean;
};

const TopCourtBar = ({
  label,
  showBack = false,
  detailMode = false,
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
      <CourtSelectorPill label={label} />
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

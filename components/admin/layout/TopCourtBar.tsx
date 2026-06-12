"use client";

import { useState } from "react";
import CourtSelectorPill from "@/components/shared/CourtSelectorPill";
import IconButton from "@/components/shared/IconButton";
import type { CourtOption } from "@/lib/admin/courts";

type TopCourtBarProps = {
  label: string;
  showBack?: boolean;
  detailMode?: boolean;
  courtOptions?: CourtOption[];
  includeAllOption?: boolean;
  groupCode?: string | null;
};

const TopCourtBar = ({
  label,
  showBack = false,
  detailMode = false,
  courtOptions = [],
  includeAllOption = false,
  groupCode = null,
}: TopCourtBarProps) => {
  const [isCodeOpen, setIsCodeOpen] = useState(false);

  return (
    <>
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
          <IconButton
            alt="QR Code"
            icon="/icons/qr-code.svg"
            onClick={() => {
              setIsCodeOpen(true);
            }}
          />
        )}
        <IconButton alt="ตั้งค่า" icon="/icons/settings-sliders.svg" />
        <IconButton alt="กลับหน้า Home" href="/home" icon="/icons/court.svg" />
      </div>

      {isCodeOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-[360px] rounded-[16px] bg-white px-6 py-7 text-center shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
            <p className="text-[14px] font-medium text-[#989898]">รหัสก๊วน</p>
            <p className="mt-3 rounded-[12px] bg-[#F3F9FF] px-4 py-4 text-[28px] font-bold tracking-[0.08em] text-[var(--color-primary)]">
              {groupCode ?? "-"}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsCodeOpen(false);
              }}
              className="mt-6 h-[46px] w-full rounded-[10px] bg-[var(--color-primary)] text-[16px] font-bold text-white"
            >
              ปิด
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default TopCourtBar;

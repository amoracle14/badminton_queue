"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { createGroup } from "@/app/actions";

const initialState = {
  ok: false,
  message: null,
};

type FieldIconProps = {
  src: string;
};

const FieldIcon = ({ src }: FieldIconProps) => {
  return (
    <Image
      src={src}
      alt=""
      width={20}
      height={20}
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
    />
  );
};

const CreateGroupScreen = () => {
  const [state, action, isPending] = useActionState(createGroup, initialState);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[440px] bg-[#FBFFFF] px-4 pb-8 pt-5 font-sans">
      <div className="flex items-center gap-2">
        <Link
          href="/home"
          aria-label="ย้อนกลับ"
          className="grid size-8 place-items-center"
        >
          <Image src="/icons/angle-left-detail.svg" alt="" width={24} height={24} />
        </Link>
        <h1 className="text-[16px] font-bold text-[var(--color-text)]">
          สร้างแก๊ง&ก๊วน
        </h1>
      </div>

      <form
        action={action}
        className="mt-6 rounded-[14px] bg-white px-4 pb-4 pt-5 shadow-[0_10px_32px_rgba(29,137,228,0.08)]"
      >
        <div className="mb-4 flex items-center gap-2">
          <Image src="/icons/glass-cheers.svg" alt="" width={24} height={24} />
          <h2 className="text-[16px] font-bold text-[var(--color-text)]">
            รายละเอียด
          </h2>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-[13px] font-medium text-[#636363]">
              ชื่อสนามแบด <span className="text-[var(--color-danger)]">*</span>
            </span>
            <div className="relative mt-2">
              <FieldIcon src="/icons/map-marker.svg" />
              <input
                name="venueName"
                placeholder="เช่น KKD Sport Complex"
                className="h-[43px] w-full rounded-[9px] border border-[#E6E6E6] px-3 pl-10 text-[15px] outline-none placeholder:text-[#C4C4C4] focus:border-[var(--color-primary)]"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[13px] font-medium text-[#636363]">
              ชื่อแก๊ง&ก๊วน <span className="text-[var(--color-danger)]">*</span>
            </span>
            <div className="relative mt-2">
              <FieldIcon src="/icons/glass-cheers.svg" />
              <input
                name="groupName"
                placeholder="ระบุชื่อแก๊ง&ก๊วน"
                className="h-[43px] w-full rounded-[9px] border border-[#E6E6E6] px-3 pl-10 text-[15px] outline-none placeholder:text-[#C4C4C4] focus:border-[var(--color-primary)]"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[13px] font-medium text-[#636363]">
              คำอธิบายแก๊ง&ก๊วน <span className="text-[var(--color-danger)]">*</span>
            </span>
            <div className="relative mt-2">
              <Image
                src="/icons/thumbtack.svg"
                alt=""
                width={20}
                height={20}
                className="pointer-events-none absolute left-3 top-3"
              />
              <textarea
                name="description"
                placeholder="ระบุคำอธิบาย เช่น ข้อมูลการติดต่อ ลูกแบดที่ใช้"
                className="h-[104px] w-full resize-none rounded-[9px] border border-[#E6E6E6] px-3 py-3 pl-10 text-[15px] outline-none placeholder:text-[#C4C4C4] focus:border-[var(--color-primary)]"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[13px] font-medium text-[#636363]">
              หมายเลขคอร์ท <span className="text-[var(--color-danger)]">*</span>
            </span>
            <div className="relative mt-2">
              <FieldIcon src="/icons/thumbtack.svg" />
              <input
                name="courtNumber"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="ระบุหมายเลขคอร์ท เช่น 3"
                className="h-[43px] w-full rounded-[9px] border border-[#E6E6E6] px-3 pl-10 text-[15px] outline-none placeholder:text-[#C4C4C4] focus:border-[var(--color-primary)]"
              />
            </div>
          </label>

          <div className="grid grid-cols-[1fr_96px] gap-2">
            <label className="block">
              <span className="text-[13px] font-medium text-[#636363]">
                วันและเวลา <span className="text-[var(--color-danger)]">*</span>
              </span>
              <div className="relative mt-2">
                <FieldIcon src="/icons/calendar.svg" />
                <input
                  name="scheduledAt"
                  type="datetime-local"
                  className="h-[43px] w-full rounded-[9px] border border-[#E6E6E6] px-3 pl-10 text-[13px] outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[13px] font-medium text-[#636363]">
                จำนวนชั่วโมง <span className="text-[var(--color-danger)]">*</span>
              </span>
              <input
                name="durationHours"
                type="number"
                inputMode="numeric"
                min={1}
                max={24}
                placeholder="ระบุจำนวน"
                className="mt-2 h-[43px] w-full rounded-[9px] border border-[#E6E6E6] px-3 text-[15px] outline-none placeholder:text-[#C4C4C4] focus:border-[var(--color-primary)]"
              />
            </label>
          </div>

          <div className="flex items-start justify-between gap-4">
            <label htmlFor="highScoreMode" className="min-w-0">
              <span className="block text-[14px] font-bold text-[var(--color-text)]">
                ตั้งค่านับสูง
              </span>
              <span className="mt-1 block text-[12px] leading-[18px] text-[#A1A1A1]">
                ตั้งค่ารูปแบบการเล่น นับคะแนน การจัดคิว การชำระเงิน
              </span>
            </label>
            <label className="relative mt-1 block h-6 w-11 shrink-0">
              <input
                id="highScoreMode"
                name="highScoreMode"
                type="checkbox"
                className="peer sr-only"
              />
              <Image
                src="/icons/toggle-switch.svg"
                alt=""
                width={44}
                height={24}
                className="opacity-70 peer-checked:opacity-100"
              />
            </label>
          </div>
        </div>

        {state.message ? (
          <p className="mt-4 rounded-[9px] bg-red-50 px-3 py-2 text-[13px] text-[var(--color-danger)]">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="mt-[72px] h-[49px] w-full rounded-[9px] bg-[var(--color-primary)] text-[16px] font-bold text-white disabled:bg-[#CCCCCC]"
        >
          {isPending ? "กำลังสร้าง..." : "สร้าง"}
        </button>
      </form>
    </main>
  );
};

export default CreateGroupScreen;

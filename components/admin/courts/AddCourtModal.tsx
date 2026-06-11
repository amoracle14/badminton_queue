"use client";

import Image from "next/image";
import { useActionState, useEffect } from "react";
import { addCourtToCurrentGroup } from "@/app/actions";

type AddCourtModalProps = {
  groupId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

const initialState = {
  ok: false,
  message: null,
};

const AddCourtModal = ({ groupId, onClose, onSaved }: AddCourtModalProps) => {
  const [state, action, isPending] = useActionState(
    addCourtToCurrentGroup,
    initialState
  );

  useEffect(() => {
    if (state.ok) {
      onSaved();
    }
  }, [onSaved, state.ok]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <form
        action={action}
        className="relative w-full max-w-[408px] rounded-[16px] bg-white px-5 pb-6 pt-7 shadow-[0_14px_36px_rgba(0,0,0,0.16)]"
      >
        <button
          type="button"
          aria-label="ปิด"
          onClick={onClose}
          className="absolute right-5 top-5 grid size-7 place-items-center rounded-full bg-[#FAFAFA]"
        >
          <Image src="/icons/close-small.svg" alt="" width={10} height={10} />
        </button>

        <h2 className="text-center text-[20px] font-bold text-[var(--color-primary)]">
          เพิ่มสนาม
        </h2>

        <input type="hidden" name="groupId" value={groupId ?? ""} />

        <div className="mt-7 space-y-4">
          <label className="block">
            <span className="text-[13px] font-medium text-[#636363]">
              หมายเลขคอร์ท
            </span>
            <input
              name="courtNumber"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="เช่น 3"
              className="mt-2 h-[43px] w-full rounded-[9px] border border-[#E6E6E6] px-3 text-[15px] outline-none placeholder:text-[#C4C4C4] focus:border-[var(--color-primary)]"
            />
          </label>

          <div className="grid grid-cols-[1fr_96px] gap-2">
            <label className="block">
              <span className="text-[13px] font-medium text-[#636363]">
                วันและเวลา
              </span>
              <input
                name="scheduledAt"
                type="datetime-local"
                className="mt-2 h-[43px] w-full rounded-[9px] border border-[#E6E6E6] px-3 text-[13px] outline-none focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="block">
              <span className="text-[13px] font-medium text-[#636363]">
                ชั่วโมง
              </span>
              <input
                name="durationHours"
                type="number"
                inputMode="numeric"
                min={1}
                max={24}
                placeholder="เช่น 2"
                className="mt-2 h-[43px] w-full rounded-[9px] border border-[#E6E6E6] px-3 text-[15px] outline-none placeholder:text-[#C4C4C4] focus:border-[var(--color-primary)]"
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
          disabled={isPending || !groupId}
          className="mt-6 h-[49px] w-full rounded-[9px] bg-[var(--color-primary)] text-[16px] font-bold text-white disabled:bg-[#CCCCCC]"
        >
          {isPending ? "กำลังเพิ่ม..." : "เพิ่มสนาม"}
        </button>
      </form>
    </div>
  );
};

export default AddCourtModal;

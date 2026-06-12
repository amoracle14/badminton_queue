"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { recoverGroup } from "@/app/actions";

const initialState = {
  ok: false,
  message: null,
  groupCode: null,
  adminKey: null,
};

const formatAdminRecoveryKey = (value: string) => {
  const normalizedValue = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 11);
  const firstPart = normalizedValue.slice(0, 3);
  const secondPart = normalizedValue.slice(3, 7);
  const thirdPart = normalizedValue.slice(7, 11);

  return [firstPart, secondPart, thirdPart].filter(Boolean).join("-");
};

const RecoverGroupScreen = () => {
  const router = useRouter();
  const [state, action, isPending] = useActionState(recoverGroup, initialState);
  const [adminKey, setAdminKey] = useState("");

  useEffect(() => {
    if (!state.ok) {
      return;
    }

    router.replace("/admin");
  }, [router, state.ok]);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[440px] bg-[#FBFFFF] px-4 pb-8 pt-5 font-sans">
      <div className="flex items-center gap-2">
        <Link
          href="/groups"
          aria-label="ย้อนกลับ"
          className="grid size-8 place-items-center"
        >
          <Image src="/icons/angle-left-detail.svg" alt="" width={24} height={24} />
        </Link>
        <h1 className="text-[16px] font-bold text-[var(--color-text)]">
          กู้คืนแก๊ง&ก๊วน
        </h1>
      </div>

      <form
        action={action}
        className="mt-6 rounded-[14px] bg-white px-4 pb-5 pt-5 shadow-[0_10px_32px_rgba(29,137,228,0.08)]"
      >
        <div className="mb-5 flex items-center gap-2">
          <Image src="/icons/home-profile.svg" alt="" width={24} height={24} />
          <h2 className="text-[16px] font-bold text-[var(--color-text)]">
            ข้อมูลกู้คืน
          </h2>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-[13px] font-medium text-[#636363]">
              รหัสก๊วน <span className="text-[var(--color-danger)]">*</span>
            </span>
            <input
              name="groupCode"
              placeholder="เช่น COURT12"
              className="mt-2 h-[43px] w-full rounded-[9px] border border-[#E6E6E6] px-3 text-[15px] uppercase outline-none placeholder:normal-case placeholder:text-[#C4C4C4] focus:border-[var(--color-primary)]"
            />
          </label>

          <label className="block">
            <span className="text-[13px] font-medium text-[#636363]">
              รหัสกู้คืนแอดมิน <span className="text-[var(--color-danger)]">*</span>
            </span>
            <input
              name="adminKey"
              value={adminKey}
              onChange={(event) => {
                setAdminKey(formatAdminRecoveryKey(event.target.value));
              }}
              placeholder="เช่น ADM-ABCD-1234"
              autoCapitalize="characters"
              maxLength={13}
              className="mt-2 h-[43px] w-full rounded-[9px] border border-[#E6E6E6] px-3 text-[15px] uppercase outline-none placeholder:normal-case placeholder:text-[#C4C4C4] focus:border-[var(--color-primary)]"
            />
          </label>
        </div>

        {state.message && !state.ok ? (
          <p
            className="mt-4 rounded-[9px] bg-red-50 px-3 py-2 text-[13px] text-[var(--color-danger)]"
          >
            {state.message}
          </p>
        ) : null}

        {state.ok ? (
          <p className="mt-5 rounded-[9px] bg-[#E9F8E5] px-3 py-3 text-center text-[14px] font-semibold text-[#2E6D09]">
            กู้คืนสำเร็จ กำลังพาไปหน้าจัดการ...
          </p>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="mt-8 h-[49px] w-full rounded-[9px] bg-[var(--color-primary)] text-[16px] font-bold text-white disabled:bg-[#CCCCCC]"
          >
            {isPending ? "กำลังกู้คืน..." : "กู้คืน"}
          </button>
        )}
      </form>
    </main>
  );
};

export default RecoverGroupScreen;

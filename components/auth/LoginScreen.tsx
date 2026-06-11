"use client";

import Image from "next/image";
import { useActionState } from "react";
import { loginWithName } from "@/app/actions";

const initialState = {
  ok: false,
  message: null,
};

const LoginScreen = () => {
  const [state, action, isPending] = useActionState(loginWithName, initialState);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-[#FBFFFF] px-6 py-10 font-sans">
      <section className="flex flex-1 flex-col justify-center">
        <div className="mb-8">
          <Image
            src="/icons/empty-players.svg"
            alt=""
            width={64}
            height={64}
            className="mb-5"
          />
          <p className="text-[15px] font-medium text-[#989898]">ยินดีต้อนรับ</p>
          <h1 className="mt-1 text-[32px] font-bold leading-tight text-[var(--color-primary)]">
            เอสคิว
          </h1>
          <p className="mt-3 max-w-[310px] text-[15px] leading-[24px] text-[#636363]">
            กรอกชื่อเพื่อเริ่มจัดการก๊วนแบดของคุณ
          </p>
        </div>

        <form action={action} className="rounded-[18px] bg-white p-5 shadow-[0_14px_36px_rgba(29,137,228,0.10)]">
          <label className="text-[15px] font-semibold text-[var(--color-text)]">
            ชื่อผู้ใช้
          </label>
          <input
            name="adminName"
            type="text"
            autoComplete="name"
            placeholder="ระบุชื่อของคุณ"
            className="mt-3 h-[50px] w-full rounded-[12px] border border-[#E6E6E6] bg-white px-4 text-[16px] font-medium text-[var(--color-text)] outline-none placeholder:text-[#C4C4C4] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[#B3E5FC]"
          />

          {state.message ? (
            <p className="mt-3 rounded-[10px] bg-red-50 px-3 py-2 text-[13px] text-[var(--color-danger)]">
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="mt-5 h-[50px] w-full rounded-[12px] bg-[var(--color-primary)] text-[16px] font-bold text-white shadow-[0_12px_24px_rgba(29,137,228,0.18)] disabled:bg-[#CCCCCC]"
          >
            {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default LoginScreen;

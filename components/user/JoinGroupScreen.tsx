"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import UserAppShell from "@/components/user/UserAppShell";

const JoinGroupScreen = () => {
  const router = useRouter();
  const [groupCode, setGroupCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedCode = groupCode.trim().toUpperCase();

    if (normalizedCode.length === 0) {
      setErrorMessage("กรุณากรอกรหัสก๊วน");
      return;
    }

    router.push(`/queue/${encodeURIComponent(normalizedCode)}`);
  };

  return (
    <UserAppShell>
      <section className="flex min-h-[calc(100dvh-48px)] flex-col justify-center">
        <Image
          src="/icons/menu-join-group.svg"
          alt=""
          width={96}
          height={76}
          className="mb-6"
        />
        <h1 className="text-[28px] font-bold leading-tight text-[#222222]">
          เข้าร่วมแก๊ง&ก๊วน
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-[#666666]">
          กรอกรหัสก๊วนที่แอดมินสร้างไว้ เพื่อดูสนามและลำดับคิวแบบเรียลไทม์
        </p>

        <form onSubmit={handleSubmit} className="mt-8 rounded-[16px] bg-white p-5 shadow-[0_12px_30px_rgba(29,137,228,0.10)]">
          <label className="text-[14px] font-semibold text-[var(--color-text)]">
            รหัสก๊วน
          </label>
          <input
            value={groupCode}
            onChange={(event) => {
              setErrorMessage(null);
              setGroupCode(event.target.value);
            }}
            placeholder="เช่น COURT03"
            className="mt-3 h-[48px] w-full rounded-[10px] border border-[#E6E6E6] px-4 text-[18px] font-bold uppercase tracking-[0.06em] text-[var(--color-text)] outline-none placeholder:text-[15px] placeholder:font-normal placeholder:tracking-normal placeholder:text-[#C4C4C4] focus:border-[var(--color-primary)]"
          />

          {errorMessage ? (
            <p className="mt-3 rounded-[9px] bg-red-50 px-3 py-2 text-[13px] text-[var(--color-danger)]">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="mt-5 h-[48px] w-full rounded-[10px] bg-[var(--color-primary)] text-[16px] font-bold text-white"
          >
            ดูข้อมูลก๊วน
          </button>
        </form>

        <Link
          href="/home"
          className="mt-6 text-center text-[15px] font-semibold text-[var(--color-primary)]"
        >
          กลับเมนู
        </Link>
      </section>
    </UserAppShell>
  );
};

export default JoinGroupScreen;

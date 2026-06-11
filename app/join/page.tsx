import Link from "next/link";

const JoinPage = () => {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-[#FBFFFF] px-6 py-10 font-sans">
      <section className="flex flex-1 flex-col justify-center">
        <h1 className="text-[26px] font-bold text-[var(--color-text)]">
          เข้าร่วมแก๊ง&ก๊วน
        </h1>
        <p className="mt-3 text-[15px] leading-[24px] text-[#636363]">
          หน้าฝั่ง User จะต่อจาก flow นี้ โดยใช้รหัสก๊วนหรือ QR ในรอบถัดไป
        </p>
        <Link
          href="/home"
          className="mt-8 grid h-[50px] place-items-center rounded-[12px] border border-[var(--color-primary)] text-[16px] font-bold text-[var(--color-primary)]"
        >
          กลับเมนู
        </Link>
      </section>
    </main>
  );
};

export default JoinPage;

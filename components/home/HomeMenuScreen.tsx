import Image from "next/image";
import Link from "next/link";

type HomeMenuScreenProps = {
  adminName: string;
};

const HomeMenuScreen = ({ adminName }: HomeMenuScreenProps) => {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[440px] bg-[#FBFFFF] px-6 pb-10 pt-8 font-sans">
      <section className="pt-2">
        <p className="text-[15px] text-[#636363]">ยินดีต้อนรับ</p>
        <h1 className="mt-1 text-[24px] font-bold text-[var(--color-primary)]">
          {adminName}
        </h1>
      </section>

      <section className="mt-10">
        <h2 className="text-[22px] font-bold text-[var(--color-text)]">เมนู</h2>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <Link
            href="/groups/new"
            className="flex min-h-[138px] flex-col justify-between overflow-hidden rounded-[14px] bg-white p-4 shadow-[0_12px_30px_rgba(29,137,228,0.10)]"
          >
            <Image src="/icons/users-team.svg" alt="" width={58} height={58} />
            <span className="text-[15px] font-bold text-[var(--color-text)]">
              สร้างแก๊ง&ก๊วน
            </span>
          </Link>

          <Link
            href="/join"
            className="flex min-h-[138px] flex-col justify-between overflow-hidden rounded-[14px] bg-white p-4 shadow-[0_12px_30px_rgba(29,137,228,0.10)]"
          >
            <Image src="/icons/empty-players.svg" alt="" width={58} height={58} />
            <span className="text-[15px] font-bold text-[var(--color-text)]">
              เข้าร่วมแก๊ง&ก๊วน
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default HomeMenuScreen;

import Image from "next/image";
import Link from "next/link";

type GroupEntryCardProps = {
  href: string;
  icon: string;
  title: string;
  description: string;
};

const GroupEntryCard = ({
  href,
  icon,
  title,
  description,
}: GroupEntryCardProps) => {
  return (
    <Link
      href={href}
      className="flex min-h-[132px] items-center gap-4 rounded-[14px] bg-white px-4 py-5 shadow-[0_12px_30px_rgba(29,137,228,0.10)]"
    >
      <div className="grid size-[64px] shrink-0 place-items-center rounded-[14px] bg-[#F3F9FF]">
        <Image src={icon} alt="" width={46} height={46} className="object-contain" />
      </div>
      <div className="min-w-0">
        <h2 className="text-[17px] font-bold text-[var(--color-text)]">{title}</h2>
        <p className="mt-2 text-[13px] leading-[20px] text-[#989898]">
          {description}
        </p>
      </div>
    </Link>
  );
};

const GroupEntryScreen = () => {
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

      <section className="mt-8 space-y-4">
        <GroupEntryCard
          href="/groups/new"
          icon="/icons/menu-create-group.svg"
          title="สร้างแก๊ง&ก๊วนใหม่"
          description="เริ่มก๊วนใหม่ด้วยสนาม วันเวลา และจำนวนชั่วโมงที่ต้องการ"
        />
        <GroupEntryCard
          href="/groups/recover"
          icon="/icons/home-profile.svg"
          title="กู้คืนแก๊ง&ก๊วน"
          description="ใช้รหัสก๊วนและรหัสกู้คืน เพื่อจัดการก๊วนเดิมจากเครื่องนี้"
        />
      </section>
    </main>
  );
};

export default GroupEntryScreen;

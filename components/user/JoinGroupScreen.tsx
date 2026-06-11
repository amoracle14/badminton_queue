import Link from "next/link";
import UserAppShell from "@/components/user/UserAppShell";

type JoinGroupScreenProps = {
  groupCode: string;
};

const JoinGroupScreen = ({ groupCode }: JoinGroupScreenProps) => {
  return (
    <UserAppShell>
      <section className="flex min-h-[calc(100dvh-48px)] flex-col justify-center">
        <p className="text-[14px] font-medium text-[var(--color-primary)]">User</p>
        <h1 className="mt-2 text-[28px] font-bold leading-tight text-[#222222]">
          เข้าร่วมก๊วน
        </h1>
        <p className="mt-3 text-[16px] leading-7 text-[#666666]">
          รหัสก๊วน {groupCode} พร้อมสำหรับหน้าผู้เล่นทั่วไปในขั้นถัดไป
        </p>

        <Link
          href={`/queue/${groupCode}`}
          className="mt-8 flex h-[48px] items-center justify-center rounded-[9px] bg-[var(--color-primary)] text-[16px] font-bold text-white"
        >
          ดูคิวของฉัน
        </Link>
      </section>
    </UserAppShell>
  );
};

export default JoinGroupScreen;

import Link from "next/link";
import UserAppShell from "@/components/user/UserAppShell";

type UserQueueScreenProps = {
  groupCode: string;
};

const UserQueueScreen = ({ groupCode }: UserQueueScreenProps) => {
  return (
    <UserAppShell>
      <section className="pt-8">
        <p className="text-[14px] font-medium text-[#1D89E4]">User Queue</p>
        <h1 className="mt-2 text-[28px] font-bold leading-tight text-[#222222]">
          คิวของก๊วน {groupCode}
        </h1>
        <div className="mt-8 rounded-[14px] bg-white p-6 shadow-[0_10px_32px_rgba(64,169,255,0.08)]">
          <p className="text-[16px] leading-7 text-[#666666]">
            พื้นที่นี้จะแสดงสถานะคิวสำหรับผู้เล่นทั่วไป เช่น ทีมที่กำลังเล่น
            ทีมที่รอ และลำดับของตัวเอง
          </p>
        </div>

        <Link
          href={`/join/${groupCode}`}
          className="mt-6 inline-flex text-[16px] font-semibold text-[#1D89E4]"
        >
          กลับไปหน้าเข้าร่วม
        </Link>
      </section>
    </UserAppShell>
  );
};

export default UserQueueScreen;

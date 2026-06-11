import Image from "next/image";
import Link from "next/link";

type CourtCardProps = {
  id: string;
  name: string;
  status: string;
  playerCount: number;
};

const CourtCard = ({ id, name, status, playerCount }: CourtCardProps) => {
  return (
    <Link
      href={`/admin/courts/${id}`}
      className="block min-h-[204px] rounded-[14px] bg-white px-4 py-[17px] shadow-[0_10px_32px_rgba(64,169,255,0.08)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/icons/empty-players.svg" alt="" width={30} height={30} />
          <span className="text-[16px] font-semibold text-[#3E3E3E]">
            {name}
          </span>
        </div>
        <span className="size-[11px] rotate-45 border-r-[3px] border-t-[3px] border-[#1597F5]" />
      </div>

      <div className="flex h-[105px] items-center justify-center">
        <span className="text-[32px] font-bold text-[#CBCBCB]">{status}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex h-[32px] items-center justify-center gap-[10px] rounded-full border border-[#EFEFEF] bg-[#FBFBFB] text-[15px] text-[#6D6D6D]">
          <Image src="/icons/users.svg" alt="" width={24} height={24} />
          <span>ประเภทคู่</span>
        </div>
        <div className="flex h-[32px] items-center justify-center gap-[10px] rounded-full border border-[#EFEFEF] bg-[#FBFBFB] text-[15px] text-[#6D6D6D]">
          <Image
            src="/icons/playing-badminton.svg"
            alt=""
            width={24}
            height={24}
          />
          <span>จำนวน {playerCount} คน</span>
        </div>
      </div>
    </Link>
  );
};

export default CourtCard;

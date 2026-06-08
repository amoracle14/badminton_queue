import Image from "next/image";
import Link from "next/link";

export default function EmptyPlayersState() {
  return (
    <div className="flex flex-col items-center">
      <Image src="/icons/search.svg" alt="" width={86} height={74} priority />
      <p className="mt-[17px] text-[16px] font-normal text-[#A7A7A7]">
        กรุณาเพิ่มผู้เล่นอย่างน้อย 4 คน
      </p>
      <Link
        href="/players"
        className="mt-[26px] grid h-[43px] w-[200px] place-items-center rounded-[9px] bg-[#2EA8FF] text-[16px] font-bold text-white shadow-[0_8px_18px_rgba(46,168,255,0.18)]"
      >
        ไปเพิ่มผู้เล่น
      </Link>
    </div>
  );
}

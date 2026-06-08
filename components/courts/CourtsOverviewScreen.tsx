import Image from "next/image";
import BottomNav from "@/components/layout/BottomNav";
import MobileAppShell from "@/components/layout/MobileAppShell";
import TopCourtBar from "@/components/layout/TopCourtBar";
import CourtCard from "@/components/courts/CourtCard";

const courts = [
  {
    id: "1",
    name: "สนามที่ 1",
  },
];

export default function CourtsOverviewScreen() {
  return (
    <MobileAppShell>
      <TopCourtBar label="สนามทั้งหมด" />

      <section className="px-4 pt-[22px]">
        <div className="mb-[19px] flex items-center justify-between">
          <h1 className="text-[16px] font-normal text-[#303030]">สนาม</h1>
          <button
            type="button"
            className="flex items-center gap-[6px] text-[16px] font-medium leading-none text-[#1D89E4]"
          >
            <Image
              src="/icons/add.svg"
              alt=""
              width={16}
              height={16}
              className="contrast-125 saturate-150"
            />
            เพิ่มสนาม
          </button>
        </div>

        <div className="space-y-4">
          {courts.map(function renderCourt(court) {
            return <CourtCard key={court.id} id={court.id} name={court.name} />;
          })}
        </div>
      </section>

      <BottomNav />
    </MobileAppShell>
  );
}

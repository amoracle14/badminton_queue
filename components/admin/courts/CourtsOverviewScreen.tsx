import Image from "next/image";
import MobileAppShell from "@/components/admin/layout/MobileAppShell";
import TopCourtBar from "@/components/admin/layout/TopCourtBar";
import CourtCard from "@/components/admin/courts/CourtCard";
import type { CourtsOverviewData } from "@/lib/admin/courts";

type CourtsOverviewScreenProps = {
  data: CourtsOverviewData;
};

const CourtsOverviewScreen = ({ data }: CourtsOverviewScreenProps) => {
  return (
    <MobileAppShell>
      <TopCourtBar label={data.groupLabel} />

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
          {data.courts.map((court) => {
            return (
              <CourtCard
                key={court.id}
                id={court.id}
                name={court.name}
                status={court.status}
                playerCount={court.playerCount}
              />
            );
          })}
        </div>
      </section>

    </MobileAppShell>
  );
};

export default CourtsOverviewScreen;

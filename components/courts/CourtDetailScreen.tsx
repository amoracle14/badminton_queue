import BottomNav from "@/components/layout/BottomNav";
import MobileAppShell from "@/components/layout/MobileAppShell";
import TopCourtBar from "@/components/layout/TopCourtBar";
import EmptyPlayersState from "@/components/shared/EmptyPlayersState";

type CourtDetailScreenProps = {
  courtName: string;
};

export default function CourtDetailScreen({ courtName }: CourtDetailScreenProps) {
  return (
    <MobileAppShell>
      <TopCourtBar label={courtName} showBack detailMode />

      <section className="px-4 pt-[27px]">
        <div className="flex min-h-[calc(100dvh-204px)] items-center justify-center rounded-[14px] bg-white shadow-[0_10px_32px_rgba(64,169,255,0.08)]">
          <EmptyPlayersState />
        </div>
      </section>

      <BottomNav />
    </MobileAppShell>
  );
}

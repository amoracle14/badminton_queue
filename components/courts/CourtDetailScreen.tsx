"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import MobileAppShell from "@/components/layout/MobileAppShell";
import TopCourtBar from "@/components/layout/TopCourtBar";
import EmptyPlayersState from "@/components/shared/EmptyPlayersState";
import AddTeamsModal from "@/components/players/AddTeamsModal";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { CourtDetailData } from "@/lib/data/courts";

type CourtDetailScreenProps = {
  data: CourtDetailData;
};

const CourtDetailScreen = ({ data }: CourtDetailScreenProps) => {
  const router = useRouter();
  const [isAddTeamsOpen, setIsAddTeamsOpen] = useState(false);

  const handleOpenAddTeams = () => {
    setIsAddTeamsOpen(true);
  };

  const handleCloseAddTeams = () => {
    setIsAddTeamsOpen(false);
  };

  const handleSavedTeams = () => {
    setIsAddTeamsOpen(false);
    router.refresh();
  };

  useEffect(() => {
    if (!data.groupId) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`court-detail:${data.groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `group_id=eq.${data.groupId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [data.groupId, router]);

  return (
    <MobileAppShell>
      <TopCourtBar label={data.courtName} showBack detailMode />

      <section className="px-4 pt-[27px]">
        <div className="flex min-h-[calc(100dvh-204px)] items-center justify-center rounded-[14px] bg-white shadow-[0_10px_32px_rgba(64,169,255,0.08)]">
          <EmptyPlayersState onAddPlayers={handleOpenAddTeams} />
        </div>
      </section>

      <BottomNav />

      {isAddTeamsOpen ? (
        <AddTeamsModal
          groupId={data.groupId}
          currentPlayerCount={data.currentPlayerCount}
          onClose={handleCloseAddTeams}
          onSaved={handleSavedTeams}
        />
      ) : null}
    </MobileAppShell>
  );
};

export default CourtDetailScreen;

"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MobileAppShell from "@/components/admin/layout/MobileAppShell";
import TopCourtBar from "@/components/admin/layout/TopCourtBar";
import EmptyPlayersState from "@/components/shared/EmptyPlayersState";
import AddTeamsModal from "@/components/admin/players/AddTeamsModal";
import CourtPlayersPanel from "@/components/admin/courts/CourtPlayersPanel";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { CourtDetailData } from "@/lib/admin/courts";

type CourtDetailScreenProps = {
  data: CourtDetailData;
};

const CourtDetailScreen = ({ data }: CourtDetailScreenProps) => {
  const router = useRouter();
  const [isAddTeamsOpen, setIsAddTeamsOpen] = useState(false);
  const [isRecordingWin, setIsRecordingWin] = useState(false);
  const [winErrorMessage, setWinErrorMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPlayers = data.currentPlayerCount > 0;

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 120);
  }, [router]);

  const handleOpenAddTeams = () => {
    setIsAddTeamsOpen(true);
  };

  const handleCloseAddTeams = () => {
    setIsAddTeamsOpen(false);
  };

  const handleSavedTeams = () => {
    setIsAddTeamsOpen(false);
    scheduleRefresh();
  };

  const handleTeamWin = async (team: "A" | "B") => {
    if (!data.currentMatch?.id || isRecordingWin) {
      return;
    }

    setIsRecordingWin(true);
    setWinErrorMessage(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.rpc("record_match_game_win", {
      p_match_id: data.currentMatch.id,
      p_winner_team: team,
    });

    setIsRecordingWin(false);

    if (error) {
      setWinErrorMessage(error.message);
      return;
    }

    scheduleRefresh();
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
          scheduleRefresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `group_id=eq.${data.groupId}`,
        },
        () => {
          scheduleRefresh();
        }
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [data.groupId, router, scheduleRefresh]);

  return (
    <MobileAppShell fullBleed={hasPlayers}>
      <div
        className={
          hasPlayers
            ? "bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-info)_100%)] pb-[120px] pt-4"
            : ""
        }
      >
        <TopCourtBar label={data.courtName} showBack detailMode />
      </div>

      {hasPlayers ? (
        <CourtPlayersPanel
          courtId={data.courtId}
          players={data.players}
          queuedPlayers={data.queuedPlayers}
          currentMatch={data.currentMatch}
          isRecordingWin={isRecordingWin}
          onAddTeams={handleOpenAddTeams}
          onTeamWin={handleTeamWin}
        />
      ) : (
        <section className="px-4 pt-[27px]">
          <div className="flex min-h-[calc(100dvh-204px)] items-center justify-center rounded-[14px] bg-white shadow-[0_10px_32px_rgba(64,169,255,0.08)]">
            <EmptyPlayersState onAddPlayers={handleOpenAddTeams} />
          </div>
        </section>
      )}

      {winErrorMessage ? (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-[408px] rounded-[9px] bg-red-50 px-4 py-3 text-[13px] text-red-500 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {winErrorMessage}
        </div>
      ) : null}

      {isAddTeamsOpen ? (
        <AddTeamsModal
          groupId={data.groupId}
          courtId={data.courtId}
          currentPlayerCount={data.currentPlayerCount}
          onClose={handleCloseAddTeams}
          onSaved={handleSavedTeams}
        />
      ) : null}
    </MobileAppShell>
  );
};

export default CourtDetailScreen;

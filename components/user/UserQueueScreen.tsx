"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { getTeamProfileSrc } from "@/lib/team-profiles";
import type { PlayerSummary } from "@/lib/admin/courts";
import type { UserQueueData } from "@/lib/user/queue";

type UserQueueScreenProps = {
  data: UserQueueData;
};

type TeamSummary = {
  id: string;
  wins: number;
  teamProfile?: string | null;
  players: PlayerSummary[];
};

const buildTeams = (players: PlayerSummary[]) => {
  const playersWithTeam = players.filter((player) => {
    return Boolean(player.teamId);
  });
  const teamsById = new Map<
    string,
    {
      queueOrder: number;
      teamProfile?: string | null;
      players: PlayerSummary[];
    }
  >();

  playersWithTeam.forEach((player, index) => {
    const teamId = player.teamId ?? `fallback-${index}`;
    const currentTeam = teamsById.get(teamId);

    if (currentTeam) {
      currentTeam.players.push(player);
      currentTeam.queueOrder = Math.min(
        currentTeam.queueOrder,
        player.queueOrder ?? Number.MAX_SAFE_INTEGER
      );
      return;
    }

    teamsById.set(teamId, {
      queueOrder: player.queueOrder ?? Number.MAX_SAFE_INTEGER,
      teamProfile: player.teamProfile,
      players: [player],
    });
  });

  return Array.from(teamsById.entries())
    .map(([teamId, team]) => {
      return {
        id: teamId,
        wins: 0,
        teamProfile: team.teamProfile,
        players: team.players
          .slice()
          .sort((firstPlayer, secondPlayer) => {
            return (firstPlayer.teamSlot ?? 0) - (secondPlayer.teamSlot ?? 0);
          }),
        queueOrder: team.queueOrder,
      };
    })
    .sort((firstTeam, secondTeam) => {
      if (firstTeam.queueOrder === secondTeam.queueOrder) {
        return firstTeam.id.localeCompare(secondTeam.id);
      }

      return firstTeam.queueOrder - secondTeam.queueOrder;
    });
};

const TeamLogo = ({ teamProfile }: { teamProfile?: string | null }) => {
  return (
    <div className="grid size-[48px] place-items-center rounded-[10px] bg-[#F4FBFF] ring-1 ring-[#E6F5FF]">
      <Image
        src={getTeamProfileSrc(teamProfile)}
        alt=""
        width={42}
        height={36}
        className="h-9 w-[42px] object-contain"
      />
    </div>
  );
};

const ReadOnlyWinBadge = ({ wins }: { wins: number }) => {
  return (
    <div className="flex h-[108px] w-[69px] shrink-0 flex-col items-center justify-center rounded-[9px] bg-[var(--color-primary)] text-white shadow-[0_8px_18px_rgba(29,137,228,0.28)]">
      <Image src="/icons/trophy.svg" alt="" width={24} height={24} />
      <span className="mt-2 text-[17px] font-bold leading-none">WIN</span>
      <span className="mt-2 text-[16px] font-semibold leading-none">
        ({wins}/2)
      </span>
    </div>
  );
};

const PlayerNames = ({ players }: { players: PlayerSummary[] }) => {
  return (
    <div className="mt-[6px] space-y-[5px] text-center text-[14px] leading-none text-[var(--color-text)]">
      <p>{players[0]?.name ?? "-"}</p>
      <p>{players[1]?.name ?? "-"}</p>
    </div>
  );
};

const ReadOnlyCurrentMatchCard = ({ teams }: { teams: TeamSummary[] }) => {
  const teamA = teams[0];
  const teamB = teams[1];

  return (
    <div className="mx-4 flex min-h-[140px] items-center rounded-[12px] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.14)]">
      <ReadOnlyWinBadge wins={teamA?.wins ?? 0} />
      <div className="flex min-w-0 flex-1 items-center justify-center gap-3 px-3">
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <TeamLogo teamProfile={teamA?.teamProfile} />
          <PlayerNames players={teamA?.players ?? []} />
        </div>
        <Image
          src="/icons/versus.svg"
          alt=""
          width={48}
          height={24}
          className="shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <TeamLogo teamProfile={teamB?.teamProfile} />
          <PlayerNames players={teamB?.players ?? []} />
        </div>
      </div>
      <ReadOnlyWinBadge wins={teamB?.wins ?? 0} />
    </div>
  );
};

const ReadOnlyQueueRow = ({
  team,
  index,
}: {
  team: TeamSummary;
  index: number;
}) => {
  const isEven = index % 2 === 0;

  return (
    <div
      className={
        isEven
          ? "flex h-[64px] items-center rounded-[10px] bg-[#E5F8FF] px-5"
          : "flex h-[64px] items-center rounded-[10px] bg-[#F6FFE6] px-5"
      }
    >
      <span className="w-[24px] text-[16px] font-bold text-[var(--color-text-muted)]">
        {index + 3}
      </span>
      <TeamLogo teamProfile={team.teamProfile} />
      <div className="ml-3 min-w-0 flex-1">
        <p className="text-[12px] font-normal leading-none text-[var(--color-text-muted)]">
          ทีม :
        </p>
        <p className="mt-[5px] truncate text-[15px] font-bold leading-none text-[var(--color-text)]">
          {team.players.map((player) => player.name).join(" - ")}
        </p>
      </div>
    </div>
  );
};

const UserTopBar = ({ courtName }: { courtName: string }) => {
  return (
    <div className="flex h-12 items-center gap-[14px] px-4">
      <Link
        href="/join"
        aria-label="ย้อนกลับ"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_24px_rgba(29,137,228,0.08)]"
      >
        <Image src="/icons/angle-left-detail.svg" alt="" width={24} height={24} />
      </Link>
      <div className="flex h-9 min-w-0 flex-1 items-center justify-between rounded-full bg-white px-[14px] text-[15px] font-semibold text-[var(--color-text)] shadow-[0_8px_24px_rgba(29,137,228,0.08)]">
        <span className="flex min-w-0 items-center gap-2">
          <Image src="/icons/empty-players.svg" alt="" width={30} height={30} />
          <span className="truncate">{courtName}</span>
        </span>
        <span className="ml-3 size-[8px] rotate-45 border-b-2 border-r-2 border-[var(--color-primary)]" />
      </div>
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_24px_rgba(29,137,228,0.08)]">
        <Image src="/icons/document-detail.svg" alt="" width={24} height={24} />
      </div>
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_24px_rgba(29,137,228,0.08)]">
        <Image src="/icons/settings-sliders.svg" alt="" width={24} height={24} />
      </div>
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_24px_rgba(29,137,228,0.08)]">
        <Image src="/icons/account-circle.svg" alt="" width={24} height={24} />
      </div>
    </div>
  );
};

const NotFoundState = ({ groupCode }: { groupCode: string }) => {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[440px] bg-[#FBFFFF] px-6 py-10 font-sans">
      <section className="flex min-h-[calc(100dvh-80px)] flex-col justify-center">
        <h1 className="text-[26px] font-bold text-[var(--color-text)]">
          ไม่พบก๊วนนี้
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-[#636363]">
          รหัส `{groupCode}` ไม่ตรงกับก๊วนในฐานข้อมูล กรุณาตรวจรหัสแล้วลองใหม่
        </p>
        <Link
          href="/join"
          className="mt-8 grid h-[50px] place-items-center rounded-[12px] bg-[var(--color-primary)] text-[16px] font-bold text-white"
        >
          กลับไปกรอกรหัส
        </Link>
      </section>
    </main>
  );
};

const UserQueueScreen = ({ data }: UserQueueScreenProps) => {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTeams =
    data.currentMatch?.teams.map((team) => {
      return {
        id: `${data.currentMatch?.id}-${team.team}`,
        wins: team.wins,
        teamProfile: team.teamProfile,
        players: team.players,
      };
    }) ?? [];
  const queueTeams = buildTeams(data.queuedPlayers);

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

  useEffect(() => {
    if (!data.groupId) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`user-queue:${data.groupId}`)
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
  }, [data.groupId, scheduleRefresh]);

  if (!data.isConnected || !data.groupId) {
    return <NotFoundState groupCode={data.groupCode} />;
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[440px] bg-[#FBFFFF] pb-8 font-sans">
      <div className="bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-info)_100%)] pb-[120px] pt-4">
        <UserTopBar courtName={data.courtName} />
      </div>

      <section className="-mt-[68px] pb-8">
        <ReadOnlyCurrentMatchCard teams={currentTeams} />
        <div className="px-4 pt-[28px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-normal text-[var(--color-text-muted)]">
              ลำดับทีม
            </h2>
            <p className="text-[13px] font-semibold text-[var(--color-primary)]">
              {data.groupCode}
            </p>
          </div>

          <div className="mt-[17px] space-y-[10px]">
            {queueTeams.length > 0 ? (
              queueTeams.map((team, index) => {
                return <ReadOnlyQueueRow key={team.id} team={team} index={index} />;
              })
            ) : (
              <div className="rounded-[14px] bg-white px-5 py-8 text-center shadow-[0_10px_32px_rgba(64,169,255,0.08)]">
                <p className="text-[16px] font-bold text-[var(--color-text)]">
                  ยังไม่มีทีมรอคิว
                </p>
                <p className="mt-2 text-[14px] text-[#989898]">
                  เมื่อแอดมินเพิ่มทีม รายการจะแสดงที่นี่
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default UserQueueScreen;

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type {
  CourtTeamSummary,
  CurrentMatchSummary,
  PlayerSummary,
} from "@/lib/admin/courts";

type TeamSummary = {
  id: string;
  team: "A" | "B";
  wins: number;
  players: PlayerSummary[];
};

type CourtPlayersPanelProps = {
  players: PlayerSummary[];
  queuedPlayers: PlayerSummary[];
  currentMatch: CurrentMatchSummary | null;
  isRecordingWin: boolean;
  onAddTeams: () => void;
  onTeamWin: (team: "A" | "B") => void;
};

type EditingTeam = {
  team: TeamSummary;
  playerOneName: string;
  playerTwoName: string;
};

type DeletingTeam = {
  team: TeamSummary;
};

type TeamListItem = {
  id: string;
  label: string;
  status: "playing" | "waiting";
  order: number;
  team: TeamSummary;
  players: PlayerSummary[];
};

const buildTeams = (players: PlayerSummary[]) => {
  const teams: TeamSummary[] = [];

  for (let index = 0; index < players.length; index += 2) {
    const teamPlayers = players.slice(index, index + 2);

    if (teamPlayers.length === 0) {
      continue;
    }

    teams.push({
      id: teamPlayers.map((player) => player.id).join("-"),
      team: teams.length === 0 ? "A" : "B",
      wins: 0,
      players: teamPlayers,
    });
  }

  return teams;
};

const buildCurrentTeams = (
  currentMatch: CurrentMatchSummary | null,
  players: PlayerSummary[]
) => {
  if (!currentMatch) {
    return buildTeams(players).slice(0, 2);
  }

  return currentMatch.teams.map((team: CourtTeamSummary) => {
    return {
      id: `${currentMatch.id}-${team.team}`,
      team: team.team,
      wins: team.wins,
      players: team.players,
    };
  });
};

const TeamLogoPlaceholder = () => {
  return (
    <div className="grid size-[48px] place-items-center rounded-[10px] bg-[#F4FBFF] ring-1 ring-[#E6F5FF]">
      <Image src="/icons/empty-players.svg" alt="" width={34} height={34} />
    </div>
  );
};

const WinBadge = ({
  wins,
  team,
  disabled,
  onTeamWin,
}: {
  wins: number;
  team: "A" | "B";
  disabled: boolean;
  onTeamWin: (team: "A" | "B") => void;
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        onTeamWin(team);
      }}
      className="flex h-[108px] w-[69px] shrink-0 flex-col items-center justify-center rounded-[9px] bg-[#40A9FF] text-white shadow-[0_8px_18px_rgba(64,169,255,0.28)] transition active:scale-[0.98] disabled:opacity-70"
    >
      <Image src="/icons/trophy.svg" alt="" width={24} height={24} />
      <span className="mt-2 text-[17px] font-bold leading-none">WIN</span>
      <span className="mt-2 text-[16px] font-semibold leading-none">
        ({wins}/2)
      </span>
    </button>
  );
};

const PlayerNames = ({ players }: { players: PlayerSummary[] }) => {
  return (
    <div className="mt-[6px] space-y-[5px] text-center text-[14px] leading-none text-[#333333]">
      <p>{players[0]?.name ?? "-"}</p>
      <p>{players[1]?.name ?? "-"}</p>
    </div>
  );
};

const CurrentMatchCard = ({
  teams,
  isRecordingWin,
  onTeamWin,
}: {
  teams: TeamSummary[];
  isRecordingWin: boolean;
  onTeamWin: (team: "A" | "B") => void;
}) => {
  const teamA = teams[0];
  const teamB = teams[1];

  return (
    <div className="mx-4 flex min-h-[140px] items-center rounded-[12px] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.14)]">
      <WinBadge
        team="A"
        wins={teamA?.wins ?? 0}
        disabled={isRecordingWin || !teamA}
        onTeamWin={onTeamWin}
      />
      <div className="flex min-w-0 flex-1 items-center justify-center gap-3 px-3">
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <TeamLogoPlaceholder />
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
          <TeamLogoPlaceholder />
          <PlayerNames players={teamB?.players ?? []} />
        </div>
      </div>
      <WinBadge
        team="B"
        wins={teamB?.wins ?? 0}
        disabled={isRecordingWin || !teamB}
        onTeamWin={onTeamWin}
      />
    </div>
  );
};

const TeamEditModal = ({
  editingTeam,
  isSaving,
  errorMessage,
  onPlayerOneChange,
  onPlayerTwoChange,
  onClose,
  onSave,
}: {
  editingTeam: EditingTeam;
  isSaving: boolean;
  errorMessage: string | null;
  onPlayerOneChange: (value: string) => void;
  onPlayerTwoChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) => {
  const canSave =
    editingTeam.playerOneName.trim().length > 0 &&
    editingTeam.playerTwoName.trim().length > 0 &&
    !isSaving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="relative w-full max-w-[408px] rounded-[14px] bg-white px-5 pb-7 pt-[34px] shadow-[0_12px_36px_rgba(0,0,0,0.16)]">
        <button
          type="button"
          aria-label="ปิด"
          onClick={onClose}
          className="absolute right-[19px] top-[22px] grid size-6 place-items-center rounded-full bg-[#FAFAFA]"
        >
          <Image src="/icons/close-small.svg" alt="" width={10} height={10} />
        </button>
        <h2 className="text-center text-[20px] font-bold text-[#1D89E4]">
          แก้ไขทีม
        </h2>
        <div className="mt-[28px] space-y-3">
          <input
            value={editingTeam.playerOneName}
            onChange={(event) => {
              onPlayerOneChange(event.target.value);
            }}
            placeholder="ชื่อผู้เล่นคนที่ 1"
            className="h-[43px] w-full rounded-[9px] border border-[#E3E3E3] bg-white px-[16px] text-[16px] text-[#333333] outline-none placeholder:text-[#C9C9C9] focus:border-[#40B7FF] focus:ring-1 focus:ring-[#40B7FF]"
          />
          <input
            value={editingTeam.playerTwoName}
            onChange={(event) => {
              onPlayerTwoChange(event.target.value);
            }}
            placeholder="ชื่อผู้เล่นคนที่ 2"
            className="h-[43px] w-full rounded-[9px] border border-[#E3E3E3] bg-white px-[16px] text-[16px] text-[#333333] outline-none placeholder:text-[#C9C9C9] focus:border-[#40B7FF] focus:ring-1 focus:ring-[#40B7FF]"
          />
        </div>
        {errorMessage ? (
          <p className="mt-4 rounded-[9px] bg-red-50 px-3 py-2 text-[13px] text-red-500">
            {errorMessage}
          </p>
        ) : null}
        <button
          type="button"
          disabled={!canSave}
          onClick={onSave}
          className="mt-[24px] flex h-[49px] w-full items-center justify-center gap-2 rounded-[9px] bg-[#2EA8FF] text-[16px] font-bold text-white disabled:bg-[#CCCCCC]"
        >
          <Image src="/icons/check-circle.svg" alt="" width={20} height={20} />
          {isSaving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
};

const TeamDeleteConfirmModal = ({
  deletingTeam,
  isDeleting,
  errorMessage,
  onClose,
  onConfirm,
}: {
  deletingTeam: DeletingTeam;
  isDeleting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="relative w-full max-w-[408px] overflow-hidden rounded-[16px] bg-white shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          aria-label="ปิด"
          onClick={onClose}
          className="absolute right-[18px] top-[18px] grid size-7 place-items-center rounded-full bg-[#FAFAFA]"
        >
          <Image src="/icons/close-small.svg" alt="" width={10} height={10} />
        </button>
        <div className="px-6 pb-6 pt-8 text-center">
          <div className="mx-auto grid size-[64px] place-items-center rounded-full bg-[#FFF1F3]">
            <Image src="/icons/trash.svg" alt="" width={28} height={28} />
          </div>
          <h2 className="mt-5 text-[22px] font-bold leading-none text-[#222222]">
            ลบทีมนี้ออกจากคิว?
          </h2>
          <p className="mx-auto mt-3 max-w-[280px] text-[15px] leading-6 text-[#777777]">
            ทีมนี้จะถูกนำออกจากลำดับคิว และไม่สามารถย้อนกลับได้
          </p>
          <div className="mt-5 flex items-center justify-center gap-3 rounded-[12px] bg-[#F8FBFC] px-4 py-3">
            <Image src="/icons/users-team.svg" alt="" width={22} height={22} />
            <span className="truncate text-[16px] font-bold text-[#333333]">
              {deletingTeam.team.players.map((player) => player.name).join(" - ")}
            </span>
          </div>
          {errorMessage ? (
            <p className="mt-4 rounded-[9px] bg-red-50 px-3 py-2 text-[13px] text-red-500">
              {errorMessage}
            </p>
          ) : null}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="h-[48px] rounded-[10px] border border-[#E8EEF2] bg-white text-[16px] font-bold text-[#666666] disabled:opacity-60"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="flex h-[48px] items-center justify-center gap-2 rounded-[10px] bg-[#FF2A3D] text-[16px] font-bold text-white shadow-[0_8px_18px_rgba(255,42,61,0.22)] disabled:opacity-60"
            >
              <Image src="/icons/trash.svg" alt="" width={20} height={20} />
              {isDeleting ? "กำลังลบ..." : "ลบทีม"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamListModal = ({
  teams,
  openMenuTeamId,
  onClose,
  onToggleMenu,
  onEdit,
  onDelete,
}: {
  teams: TeamListItem[];
  openMenuTeamId: string | null;
  onClose: () => void;
  onToggleMenu: (teamId: string) => void;
  onEdit: (team: TeamSummary) => void;
  onDelete: (team: TeamSummary) => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="relative flex max-h-[82dvh] w-full max-w-[408px] flex-col rounded-[18px] bg-white shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between border-b border-[#EFF4F7] px-5 py-4">
          <div>
            <h2 className="text-[20px] font-bold leading-none text-[#222222]">
              รายชื่อทีมทั้งหมด
            </h2>
            <p className="mt-2 text-[13px] text-[#9A9A9A]">
              ทั้งหมด {teams.length} ทีม
            </p>
          </div>
          <button
            type="button"
            aria-label="ปิด"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full bg-[#FAFAFA]"
          >
            <Image src="/icons/close-small.svg" alt="" width={10} height={10} />
          </button>
        </div>
        <div className="space-y-3 overflow-y-auto px-5 py-4">
          {teams.map((team) => {
            const isPlaying = team.status === "playing";
            const isActionOpen = openMenuTeamId === team.id;

            return (
              <div
                key={team.id}
                className={
                  isPlaying
                    ? "rounded-[12px] bg-[#E5F8FF] px-4 py-3"
                    : "rounded-[12px] bg-[#F6FFE6] px-4 py-3"
                }
              >
                <div className="flex min-h-[44px] items-center">
                  <span className="w-[28px] text-[16px] font-bold text-[#9A9A9A]">
                    {team.order}
                  </span>
                  <TeamLogoPlaceholder />
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] leading-none text-[#9A9A9A]">
                        {team.label}
                      </p>
                      <span
                        className={
                          isPlaying
                            ? "rounded-full bg-[#D7F0FF] px-2 py-[3px] text-[11px] font-semibold leading-none text-[#1D89E4]"
                            : "rounded-full bg-white/70 px-2 py-[3px] text-[11px] font-semibold leading-none text-[#7B9A3C]"
                        }
                      >
                        {isPlaying ? "กำลังเล่น" : "รอคิว"}
                      </span>
                    </div>
                    <p className="mt-[7px] truncate text-[15px] font-bold leading-none text-[#333333]">
                      {team.players.map((player) => player.name).join(" - ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="จัดการทีม"
                    onClick={() => {
                      onToggleMenu(team.id);
                    }}
                    className="ml-2 grid size-9 place-items-center rounded-full"
                  >
                    <Image
                      src="/icons/more-vertical-blue.svg"
                      alt=""
                      width={24}
                      height={24}
                    />
                  </button>
                </div>
                {isActionOpen ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/70 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        onEdit(team.team);
                      }}
                      className="flex h-[40px] items-center justify-center gap-2 rounded-[9px] bg-white text-[14px] font-semibold text-[#333333] shadow-[0_6px_14px_rgba(0,0,0,0.06)]"
                    >
                      <Image src="/icons/document.svg" alt="" width={20} height={20} />
                      แก้ไขชื่อ
                    </button>
                    <button
                      type="button"
                      disabled={isPlaying}
                      onClick={() => {
                        onDelete(team.team);
                      }}
                      className="flex h-[40px] items-center justify-center gap-2 rounded-[9px] bg-white text-[14px] font-semibold text-[#FF2A3D] shadow-[0_6px_14px_rgba(0,0,0,0.06)] disabled:text-[#BBBBBB]"
                    >
                      <Image
                        src="/icons/trash.svg"
                        alt=""
                        width={20}
                        height={20}
                        className={isPlaying ? "opacity-35 grayscale" : ""}
                      />
                      ลบทีม
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const QueueTeamRow = ({
  team,
  index,
  isMenuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
}: {
  team: TeamSummary;
  index: number;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const isEven = index % 2 === 0;

  return (
    <div
      className={
        isEven
          ? "relative flex h-[64px] items-center rounded-[10px] bg-[#E5F8FF] px-5"
          : "relative flex h-[64px] items-center rounded-[10px] bg-[#F6FFE6] px-5"
      }
    >
      <span className="w-[24px] text-[16px] font-bold text-[#9A9A9A]">
        {index + 3}
      </span>
      <TeamLogoPlaceholder />
      <div className="ml-3 min-w-0 flex-1">
        <p className="text-[12px] font-normal leading-none text-[#9A9A9A]">
          ทีม :
        </p>
        <p className="mt-[5px] truncate text-[15px] font-bold leading-none text-[#333333]">
          {team.players.map((player) => player.name).join(" - ")}
        </p>
      </div>
      <button
        type="button"
        aria-label="จัดการทีม"
        onClick={onToggleMenu}
        className="grid size-9 place-items-center rounded-full"
      >
        <Image
          src="/icons/more-vertical-blue.svg"
          alt=""
          width={24}
          height={24}
        />
      </button>
      {isMenuOpen ? (
        <div className="absolute right-4 top-[54px] z-20 w-[156px] overflow-hidden rounded-[10px] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.16)] ring-1 ring-black/5">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-[44px] w-full items-center gap-3 px-4 text-left text-[14px] font-medium text-[#333333]"
          >
            <Image src="/icons/document.svg" alt="" width={20} height={20} />
            แก้ไขชื่อ
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-[44px] w-full items-center gap-3 px-4 text-left text-[14px] font-medium text-[#FF2A3D]"
          >
            <Image src="/icons/trash.svg" alt="" width={20} height={20} />
            ลบทีม
          </button>
        </div>
      ) : null}
    </div>
  );
};

const CourtPlayersPanel = ({
  players,
  queuedPlayers,
  currentMatch,
  isRecordingWin,
  onAddTeams,
  onTeamWin,
}: CourtPlayersPanelProps) => {
  const router = useRouter();
  const currentTeams = buildCurrentTeams(currentMatch, players);
  const queueTeams = buildTeams(queuedPlayers);
  const [openMenuTeamId, setOpenMenuTeamId] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<EditingTeam | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<DeletingTeam | null>(null);
  const [isTeamListOpen, setIsTeamListOpen] = useState(false);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [teamActionError, setTeamActionError] = useState<string | null>(null);
  const allTeams: TeamListItem[] = [
    ...currentTeams.map((team, index) => {
      return {
        id: `playing-${team.id}`,
        label: `ทีม ${index + 1}`,
        status: "playing" as const,
        order: index + 1,
        team,
        players: team.players,
      };
    }),
    ...queueTeams.map((team, index) => {
      return {
        id: `waiting-${team.id}`,
        label: "ทีม",
        status: "waiting" as const,
        order: currentTeams.length + index + 1,
        team,
        players: team.players,
      };
    }),
  ];

  const handleEditTeam = (team: TeamSummary) => {
    setOpenMenuTeamId(null);
    setTeamActionError(null);
    setEditingTeam({
      team,
      playerOneName: team.players[0]?.name ?? "",
      playerTwoName: team.players[1]?.name ?? "",
    });
  };

  const handleAskDeleteTeam = (team: TeamSummary) => {
    setOpenMenuTeamId(null);
    setTeamActionError(null);

    if (team.players.length < 2) {
      return;
    }

    setDeletingTeam({ team });
  };

  const handleConfirmDeleteTeam = async () => {
    if (!deletingTeam || deletingTeam.team.players.length < 2) {
      return;
    }

    setIsSavingTeam(true);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.rpc("delete_waiting_team", {
      p_player_one_id: deletingTeam.team.players[0].id,
      p_player_two_id: deletingTeam.team.players[1].id,
    });

    setIsSavingTeam(false);

    if (error) {
      setTeamActionError(error.message);
      return;
    }

    setDeletingTeam(null);
    router.refresh();
  };

  const handleSaveTeam = async () => {
    if (!editingTeam || editingTeam.team.players.length < 2) {
      return;
    }

    setIsSavingTeam(true);
    setTeamActionError(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.rpc("update_waiting_team", {
      p_player_one_id: editingTeam.team.players[0].id,
      p_player_one_name: editingTeam.playerOneName.trim(),
      p_player_two_id: editingTeam.team.players[1].id,
      p_player_two_name: editingTeam.playerTwoName.trim(),
    });

    setIsSavingTeam(false);

    if (error) {
      setTeamActionError(error.message);
      return;
    }

    setEditingTeam(null);
    router.refresh();
  };

  return (
    <section className="-mt-[68px]">
      <CurrentMatchCard
        teams={currentTeams}
        isRecordingWin={isRecordingWin}
        onTeamWin={onTeamWin}
      />
      <div className="px-4 pt-[28px]">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-normal text-[#9A9A9A]">ลำดับทีม</h2>
          <button
            type="button"
            onClick={onAddTeams}
            className="flex items-center gap-[6px] text-[16px] font-medium leading-none text-[#1D89E4]"
          >
            <Image src="/icons/add.svg" alt="" width={16} height={16} />
            เพิ่มทีม
          </button>
        </div>
        <div className="mt-[17px] space-y-[10px]">
          {queueTeams.map((team, index) => {
            return (
              <QueueTeamRow
                key={team.id}
                team={team}
                index={index}
                isMenuOpen={openMenuTeamId === team.id}
                onToggleMenu={() => {
                  setOpenMenuTeamId((currentTeamId) => {
                    return currentTeamId === team.id ? null : team.id;
                  });
                }}
                onEdit={() => {
                  handleEditTeam(team);
                }}
                onDelete={() => {
                  handleAskDeleteTeam(team);
                }}
              />
            );
          })}
        </div>
        {teamActionError && !editingTeam && !deletingTeam ? (
          <p className="mt-4 rounded-[9px] bg-red-50 px-3 py-2 text-[13px] text-red-500">
            {teamActionError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setOpenMenuTeamId(null);
            setIsTeamListOpen(true);
          }}
          className="mt-[18px] h-[48px] w-full rounded-[9px] border border-[#1D89E4] text-[16px] font-bold text-[#1D89E4]"
        >
          จัดการ
        </button>
      </div>
      {editingTeam ? (
        <TeamEditModal
          editingTeam={editingTeam}
          isSaving={isSavingTeam}
          errorMessage={teamActionError}
          onPlayerOneChange={(value) => {
            setEditingTeam((currentTeam) => {
              if (!currentTeam) {
                return currentTeam;
              }

              return {
                ...currentTeam,
                playerOneName: value,
              };
            });
          }}
          onPlayerTwoChange={(value) => {
            setEditingTeam((currentTeam) => {
              if (!currentTeam) {
                return currentTeam;
              }

              return {
                ...currentTeam,
                playerTwoName: value,
              };
            });
          }}
          onClose={() => {
            setEditingTeam(null);
            setTeamActionError(null);
          }}
          onSave={() => {
            void handleSaveTeam();
          }}
        />
      ) : null}
      {deletingTeam ? (
        <TeamDeleteConfirmModal
          deletingTeam={deletingTeam}
          isDeleting={isSavingTeam}
          errorMessage={teamActionError}
          onClose={() => {
            setDeletingTeam(null);
            setTeamActionError(null);
          }}
          onConfirm={() => {
            void handleConfirmDeleteTeam();
          }}
        />
      ) : null}
      {isTeamListOpen ? (
        <TeamListModal
          teams={allTeams}
          openMenuTeamId={openMenuTeamId}
          onClose={() => {
            setOpenMenuTeamId(null);
            setIsTeamListOpen(false);
          }}
          onToggleMenu={(teamId) => {
            setOpenMenuTeamId((currentTeamId) => {
              return currentTeamId === teamId ? null : teamId;
            });
          }}
          onEdit={(team) => {
            setIsTeamListOpen(false);
            handleEditTeam(team);
          }}
          onDelete={(team) => {
            setIsTeamListOpen(false);
            handleAskDeleteTeam(team);
          }}
        />
      ) : null}
    </section>
  );
};

export default CourtPlayersPanel;

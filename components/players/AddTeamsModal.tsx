"use client";

import Image from "next/image";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type TeamDraft = {
  id: number;
  playerOne: string;
  playerTwo: string;
};

type AddTeamsModalProps = {
  groupId: string | null;
  currentPlayerCount: number;
  onClose: () => void;
  onSaved: () => void;
};

const createTeamDraft = (id: number): TeamDraft => {
  return {
    id,
    playerOne: "",
    playerTwo: "",
  };
};

const AddTeamsModal = ({
  groupId,
  currentPlayerCount,
  onClose,
  onSaved,
}: AddTeamsModalProps) => {
  const [teams, setTeams] = useState<TeamDraft[]>([createTeamDraft(1)]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasExistingPlayers = currentPlayerCount > 0;
  const hasMinimumTeams = hasExistingPlayers || teams.length >= 2;
  const areAllNamesFilled = teams.every((team) => {
    return team.playerOne.trim().length > 0 && team.playerTwo.trim().length > 0;
  });
  const canEnterCourt =
    Boolean(groupId) && hasMinimumTeams && areAllNamesFilled && !isSubmitting;
  const statusColor = hasMinimumTeams ? "#23C55E" : "#CCCCCC";
  const trashColor = hasMinimumTeams ? "#FF2A3D" : "#CCCCCC";

  const handleAddTeam = () => {
    setTeams((currentTeams) => {
      const nextId =
        currentTeams.reduce((highestId, team) => {
          return Math.max(highestId, team.id);
        }, 0) + 1;

      return [...currentTeams, createTeamDraft(nextId)];
    });
  };

  const handleRemoveTeam = (teamId: number) => {
    setTeams((currentTeams) => {
      if (currentTeams.length === 1) {
        return currentTeams;
      }

      return currentTeams.filter((team) => team.id !== teamId);
    });
  };

  const handleNameChange = (
    teamId: number,
    field: "playerOne" | "playerTwo",
    value: string
  ) => {
    setTeams((currentTeams) => {
      return currentTeams.map((team) => {
        if (team.id !== teamId) {
          return team;
        }

        return {
          ...team,
          [field]: value,
        };
      });
    });
  };

  const handleSubmit = async () => {
    if (!groupId || !canEnterCourt) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const playerNames = teams.flatMap((team) => {
      return [team.playerOne.trim(), team.playerTwo.trim()];
    });
    const playerRows = playerNames.map((name, index) => {
      return {
        group_id: groupId,
        name,
        status: "waiting",
        queue_order: currentPlayerCount + index + 1,
      };
    });
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("players").insert(playerRows);

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="relative w-full max-w-[408px] rounded-[14px] bg-white px-5 pb-8 pt-[34px] shadow-[0_12px_36px_rgba(0,0,0,0.16)]">
        <button
          type="button"
          aria-label="ปิด"
          onClick={onClose}
          className="absolute right-[19px] top-[22px] grid size-6 place-items-center rounded-full bg-[#FAFAFA]"
        >
          <Image src="/icons/close-small.svg" alt="" width={10} height={10} />
        </button>

        <h2 className="text-center text-[20px] font-bold text-[#1D89E4]">
          เพิ่มทีม
        </h2>

        <div className="mt-[30px] flex items-start justify-between">
          <div>
            <div className="flex items-center gap-[7px] text-[16px] font-semibold text-[#333333]">
              <Image src="/icons/users-team.svg" alt="" width={22} height={22} />
              <span>ประเภทคู่</span>
            </div>
            <p className="mt-[8px] text-[15px] font-normal text-[#9B9B9B]">
              ต้องเพิ่มทีมอย่างน้อย 2 ทีม
            </p>
          </div>
          <span
            aria-hidden="true"
            className="mt-[30px] size-[22px] bg-current"
            style={{
              color: statusColor,
              WebkitMaskImage: "url('/icons/check-circle.svg')",
              maskImage: "url('/icons/check-circle.svg')",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        </div>

        <div className="mt-[26px] space-y-[17px]">
          {teams.map((team, index) => {
            return (
              <div key={team.id}>
                <p className="mb-[8px] text-[14px] font-normal text-[#666666]">
                  ทีมที่ {index + 1}
                </p>
                <div className="grid grid-cols-[1fr_1fr_32px] gap-2">
                  <input
                    value={team.playerOne}
                    onChange={(event) => {
                      handleNameChange(team.id, "playerOne", event.target.value);
                    }}
                    placeholder="ชื่อผู้เล่นคนที่ 1"
                    className="h-[43px] min-w-0 rounded-[9px] border border-[#E3E3E3] bg-white px-[16px] text-[16px] font-normal text-[#333333] outline-none placeholder:text-[#C9C9C9] focus:border-[#40B7FF] focus:ring-1 focus:ring-[#40B7FF]"
                  />
                  <input
                    value={team.playerTwo}
                    onChange={(event) => {
                      handleNameChange(team.id, "playerTwo", event.target.value);
                    }}
                    placeholder="ชื่อผู้เล่นคนที่ 2"
                    className="h-[43px] min-w-0 rounded-[9px] border border-[#E3E3E3] bg-white px-[16px] text-[16px] font-normal text-[#333333] outline-none placeholder:text-[#C9C9C9] focus:border-[#40B7FF] focus:ring-1 focus:ring-[#40B7FF]"
                  />
                  <button
                    type="button"
                    aria-label={`ลบทีมที่ ${index + 1}`}
                    onClick={() => {
                      handleRemoveTeam(team.id);
                    }}
                    className="grid size-[32px] place-items-center self-center rounded-[9px] border border-[#F0F0F0] bg-white"
                  >
                    <span
                      aria-hidden="true"
                      className="size-[18px] bg-current"
                      style={{
                        color: trashColor,
                        WebkitMaskImage: "url('/icons/trash.svg')",
                        maskImage: "url('/icons/trash.svg')",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                      }}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddTeam}
          className="mx-auto mt-[27px] flex items-center gap-[6px] text-[16px] font-medium text-[#1D89E4]"
        >
          <Image src="/icons/add.svg" alt="" width={16} height={16} />
          เพิ่มทีม
        </button>

        {errorMessage ? (
          <p className="mt-4 rounded-[9px] bg-red-50 px-3 py-2 text-[13px] text-red-500">
            {errorMessage}
          </p>
        ) : null}

        {!groupId ? (
          <p className="mt-4 rounded-[9px] bg-amber-50 px-3 py-2 text-[13px] text-amber-600">
            ยังไม่พบก๊วนในฐานข้อมูล กรุณาสร้างก๊วนใน Supabase ก่อนเพิ่มผู้เล่น
          </p>
        ) : null}

        <button
          type="button"
          disabled={!canEnterCourt}
          onClick={handleSubmit}
          className="mt-[27px] h-[49px] w-full rounded-[9px] bg-[#2EA8FF] text-[16px] font-bold text-white disabled:bg-[#CCCCCC]"
        >
          {isSubmitting ? "กำลังบันทึก..." : "เข้าเล่น"}
        </button>
      </div>
    </div>
  );
};

export default AddTeamsModal;

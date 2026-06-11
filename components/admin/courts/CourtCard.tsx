import Image from "next/image";
import Link from "next/link";
import { getTeamProfileSrc } from "@/lib/team-profiles";
import type { CourtOverviewTeamSummary } from "@/lib/admin/courts";

type CourtCardProps = {
  id: string;
  name: string;
  status: string;
  playerCount: number;
  teams: CourtOverviewTeamSummary[];
};

const CourtCard = ({ id, name, status, playerCount, teams }: CourtCardProps) => {
  const isPlaying = teams.length >= 2;
  const teamA = teams.find((team) => {
    return team.team === "A";
  });
  const teamB = teams.find((team) => {
    return team.team === "B";
  });

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
        <span className="size-[11px] rotate-45 border-r-[3px] border-t-[3px] border-[var(--color-primary)]" />
      </div>

      {isPlaying ? (
        <div className="flex h-[105px] items-center justify-between gap-2 px-1 pt-2">
          <div className="flex min-w-0 flex-1 flex-col items-center">
            <Image
              src={getTeamProfileSrc(teamA?.teamProfile)}
              alt=""
              width={70}
              height={52}
              className="h-[52px] w-[70px] object-contain"
            />
            <span className="mt-2 line-clamp-2 max-w-[100px] text-center text-[13px] font-bold leading-[16px] text-[#464646]">
              {teamA?.label ?? "TEAM A"}
            </span>
          </div>
          <div className="flex h-[40px] w-[130px] shrink-0 items-center justify-center rounded-full border border-[#EFEFEF] bg-[#FBFBFB]">
            <span className="rounded-full bg-[var(--color-primary-accent)] px-5 py-[10px] text-[16px] font-bold leading-none text-white shadow-[0_2px_0_rgba(0,0,0,0.12)]">
              PLAYING
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center">
            <Image
              src={getTeamProfileSrc(teamB?.teamProfile)}
              alt=""
              width={70}
              height={52}
              className="h-[52px] w-[70px] object-contain"
            />
            <span className="mt-2 line-clamp-2 max-w-[100px] text-center text-[13px] font-bold leading-[16px] text-[#464646]">
              {teamB?.label ?? "TEAM B"}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex h-[105px] items-center justify-center">
          <span className="text-[32px] font-bold text-[#CBCBCB]">{status}</span>
        </div>
      )}

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

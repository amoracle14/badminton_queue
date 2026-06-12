import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CourtOption,
  CourtTeamSummary,
  CurrentMatchSummary,
  PlayerSummary,
} from "@/lib/admin/courts";

type CourtRow = {
  id: string;
  group_id: string;
  court_number: number;
  status: string;
};

type GroupWithCourtsRow = {
  id: string;
  code: string;
  name: string;
  courts: CourtRow[] | null;
};

type MatchPlayerWithPlayerRow = {
  id: string;
  team: "A" | "B";
  slot: number;
  players:
    | {
        id: string;
        name: string;
        status: string;
        team_id?: string | null;
        team_slot?: number | null;
        team_profile?: string | null;
      }
    | {
        id: string;
        name: string;
        status: string;
        team_id?: string | null;
        team_slot?: number | null;
        team_profile?: string | null;
      }[]
    | null;
};

type MatchWithPlayersRow = {
  id: string;
  team_a_wins: number | null;
  team_b_wins: number | null;
  match_players: MatchPlayerWithPlayerRow[] | null;
};

type QueuedPlayerRow = {
  id: string;
  name: string;
  status: string;
  team_id: string | null;
  team_slot: number | null;
  queue_order: number | null;
  team_profile: string | null;
};

export type UserQueueData = {
  groupId: string | null;
  groupCode: string;
  groupName: string | null;
  courtId: string | null;
  courtName: string;
  courtOptions: CourtOption[];
  currentPlayerCount: number;
  currentMatch: CurrentMatchSummary | null;
  queuedPlayers: PlayerSummary[];
  isConnected: boolean;
};

const buildCourtName = (courtNumber: number) => {
  return `สนามที่ ${courtNumber}`;
};

const getTeamsFromMatch = (match: MatchWithPlayersRow) => {
  const teams: CourtTeamSummary[] = [
    {
      team: "A",
      wins: match.team_a_wins ?? 0,
      teamProfile: null,
      players: [],
    },
    {
      team: "B",
      wins: match.team_b_wins ?? 0,
      teamProfile: null,
      players: [],
    },
  ];

  (match.match_players ?? [])
    .slice()
    .sort((firstPlayer, secondPlayer) => {
      if (firstPlayer.team === secondPlayer.team) {
        return firstPlayer.slot - secondPlayer.slot;
      }

      return firstPlayer.team.localeCompare(secondPlayer.team);
    })
    .forEach((matchPlayer) => {
      const player = Array.isArray(matchPlayer.players)
        ? matchPlayer.players[0]
        : matchPlayer.players;

      if (!player) {
        return;
      }

      const team = teams.find((currentTeam) => {
        return currentTeam.team === matchPlayer.team;
      });

      if (team && !team.teamProfile) {
        team.teamProfile = player.team_profile;
      }

      team?.players.push({
        id: player.id,
        name: player.name,
        status: player.status,
        teamId: player.team_id,
        teamSlot: player.team_slot,
        teamProfile: player.team_profile,
      });
    });

  return teams;
};

const getCurrentMatchByCourt = async (
  courtId: string
): Promise<CurrentMatchSummary | null> => {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("matches")
    .select(
      "id,team_a_wins,team_b_wins,match_players(id,team,slot,players(id,name,status,team_id,team_slot,team_profile))"
    )
    .eq("court_id", courtId)
    .in("status", ["active", "paused"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle<MatchWithPlayersRow>();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    teams: getTeamsFromMatch(data),
  };
};

const getQueuedPlayersByCourt = async (courtId: string) => {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("players")
    .select("id,name,status,team_id,team_slot,queue_order,team_profile")
    .eq("court_id", courtId)
    .eq("status", "waiting")
    .order("queue_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as QueuedPlayerRow[]).map((player) => {
    return {
      id: player.id,
      name: player.name,
      status: player.status,
      teamId: player.team_id,
      teamSlot: player.team_slot,
      queueOrder: player.queue_order,
      teamProfile: player.team_profile,
    };
  });
};

const getCourtPlayerCount = async (courtId: string) => {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("court_id", courtId)
    .in("status", ["waiting", "playing"]);

  if (error) {
    return 0;
  }

  return count ?? 0;
};

export const getUserQueueDataByCode = async (
  groupCode: string,
  selectedCourtId?: string | null
): Promise<UserQueueData> => {
  const normalizedCode = groupCode.trim().toUpperCase();
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      groupId: null,
      groupCode: normalizedCode,
      groupName: null,
      courtId: null,
      courtName: "สนามที่ 1",
      courtOptions: [],
      currentPlayerCount: 0,
      currentMatch: null,
      queuedPlayers: [],
      isConnected: false,
    };
  }

  const { data, error } = await supabase
    .from("groups")
    .select("id,code,name,courts(id,group_id,court_number,status)")
    .eq("code", normalizedCode)
    .maybeSingle<GroupWithCourtsRow>();

  if (error || !data) {
    return {
      groupId: null,
      groupCode: normalizedCode,
      groupName: null,
      courtId: null,
      courtName: "สนามที่ 1",
      courtOptions: [],
      currentPlayerCount: 0,
      currentMatch: null,
      queuedPlayers: [],
      isConnected: false,
    };
  }

  const sortedCourts = (data.courts ?? []).sort((firstCourt, secondCourt) => {
    return firstCourt.court_number - secondCourt.court_number;
  });
  const selectedCourt =
    sortedCourts.find((court) => {
      return court.id === selectedCourtId;
    }) ?? sortedCourts[0];

  if (!selectedCourt) {
    return {
      groupId: data.id,
      groupCode: data.code,
      groupName: data.name,
      courtId: null,
      courtName: "สนามที่ 1",
      courtOptions: [],
      currentPlayerCount: 0,
      currentMatch: null,
      queuedPlayers: [],
      isConnected: true,
    };
  }

  const [currentMatch, queuedPlayers, currentPlayerCount] = await Promise.all([
    getCurrentMatchByCourt(selectedCourt.id),
    getQueuedPlayersByCourt(selectedCourt.id),
    getCourtPlayerCount(selectedCourt.id),
  ]);

  return {
    groupId: data.id,
    groupCode: data.code,
    groupName: data.name,
    courtId: selectedCourt.id,
    courtName: buildCourtName(selectedCourt.court_number),
    courtOptions: sortedCourts.map((court) => {
      return {
        id: court.id,
        name: buildCourtName(court.court_number),
      };
    }),
    currentPlayerCount,
    currentMatch,
    queuedPlayers,
    isConnected: true,
  };
};

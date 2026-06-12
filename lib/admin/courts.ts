import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAdminSession } from "@/lib/session";

export type CourtSummary = {
  id: string;
  name: string;
  number: number;
  status: string;
  playerCount: number;
  teams: CourtOverviewTeamSummary[];
};

export type CourtOption = {
  id: string;
  name: string;
};

export type PlayerSummary = {
  id: string;
  name: string;
  status: string;
  teamId?: string | null;
  teamSlot?: number | null;
  queueOrder?: number | null;
  teamProfile?: string | null;
};

export type CourtTeamSummary = {
  team: "A" | "B";
  wins: number;
  teamProfile?: string | null;
  players: PlayerSummary[];
};

export type CourtOverviewTeamSummary = {
  team: "A" | "B";
  label: string;
  teamProfile?: string | null;
};

export type CurrentMatchSummary = {
  id: string;
  teams: CourtTeamSummary[];
};

export type CourtsOverviewData = {
  groupId: string | null;
  groupCode: string | null;
  groupLabel: string;
  adminName: string | null;
  courtOptions: CourtOption[];
  courts: CourtSummary[];
  isConnected: boolean;
};

export type CourtDetailData = {
  courtId: string | null;
  groupId: string | null;
  groupCode: string | null;
  courtName: string;
  adminName: string | null;
  courtOptions: CourtOption[];
  currentPlayerCount: number;
  currentMatch: CurrentMatchSummary | null;
  players: PlayerSummary[];
  queuedPlayers: PlayerSummary[];
  isConnected: boolean;
};

type CourtRow = {
  id: string;
  group_id?: string;
  court_number: number;
  status: string;
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
  court_id?: string | null;
  team_a_wins: number | null;
  team_b_wins: number | null;
  match_players: MatchPlayerWithPlayerRow[] | null;
};

type PlayerCourtRow = {
  court_id: string | null;
  status: string;
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

type GroupRow = {
  id: string;
  name: string;
  code: string;
  admin_name?: string | null;
  admin_session_id?: string | null;
  courts: CourtRow[] | null;
};

type AdminGroupShellData = {
  groupId: string | null;
  groupCode: string | null;
  adminName: string | null;
  courtOptions: CourtOption[];
  courts: CourtRow[];
};

const fallbackOverviewData: CourtsOverviewData = {
  groupId: null,
  groupCode: null,
  groupLabel: "สนามทั้งหมด",
  adminName: null,
  courtOptions: [],
  courts: [
    {
      id: "1",
      name: "สนามที่ 1",
      number: 1,
      status: "ว่าง",
      playerCount: 0,
      teams: [],
    },
  ],
  isConnected: false,
};

const buildCourtName = (courtNumber: number) => {
  return `สนามที่ ${courtNumber}`;
};

const normalizeCourtStatus = (status: string) => {
  if (status === "idle") {
    return "ว่าง";
  }

  if (status === "playing") {
    return "กำลังเล่น";
  }

  return "พักเกม";
};

const getPlayerCountsByCourt = async (courtIds: string[]) => {
  const supabase = createServerSupabaseClient();
  const countsByCourt = new Map<string, number>();

  courtIds.forEach((courtId) => {
    countsByCourt.set(courtId, 0);
  });

  if (!supabase || courtIds.length === 0) {
    return countsByCourt;
  }

  const { data, error } = await supabase
    .from("players")
    .select("court_id,status")
    .in("court_id", courtIds)
    .in("status", ["waiting", "playing"]);

  if (error || !data) {
    return countsByCourt;
  }

  (data as PlayerCourtRow[]).forEach((player) => {
    if (!player.court_id) {
      return;
    }

    countsByCourt.set(
      player.court_id,
      (countsByCourt.get(player.court_id) ?? 0) + 1
    );
  });

  return countsByCourt;
};

const getAdminGroupShellData = async (): Promise<AdminGroupShellData> => {
  const supabase = createServerSupabaseClient();
  const adminSession = await getCurrentAdminSession();

  if (!adminSession) {
    return {
      groupId: null,
      groupCode: null,
      adminName: null,
      courtOptions: [],
      courts: [],
    };
  }

  if (!supabase) {
    return {
      groupId: null,
      groupCode: null,
      adminName: adminSession.adminName,
      courtOptions: [],
      courts: [],
    };
  }

  const { data, error } = await supabase
    .from("groups")
    .select("id,code,admin_name,admin_session_id,courts(id,group_id,court_number,status)")
    .eq("admin_session_id", adminSession.adminSessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<GroupRow>();

  if (error || !data) {
    return {
      groupId: null,
      groupCode: null,
      adminName: adminSession.adminName,
      courtOptions: [],
      courts: [],
    };
  }

  const courts = (data.courts ?? []).sort((firstCourt, secondCourt) => {
    return firstCourt.court_number - secondCourt.court_number;
  });

  return {
    groupId: data.id,
    groupCode: data.code,
    adminName: adminSession.adminName,
    courts,
    courtOptions: courts.map((court) => {
      return {
        id: court.id,
        name: buildCourtName(court.court_number),
      };
    }),
  };
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

const getActiveTeamsByCourt = async (courtIds: string[]) => {
  const supabase = createServerSupabaseClient();
  const teamsByCourt = new Map<string, CourtOverviewTeamSummary[]>();

  courtIds.forEach((courtId) => {
    teamsByCourt.set(courtId, []);
  });

  if (!supabase || courtIds.length === 0) {
    return teamsByCourt;
  }

  const { data, error } = await supabase
    .from("matches")
    .select(
      "id,court_id,team_a_wins,team_b_wins,match_players(id,team,slot,players(id,name,status,team_id,team_slot,team_profile))"
    )
    .in("court_id", courtIds)
    .in("status", ["active", "paused"])
    .order("started_at", { ascending: false });

  if (error || !data) {
    return teamsByCourt;
  }

  (data as MatchWithPlayersRow[]).forEach((match) => {
    if (!match.court_id || (teamsByCourt.get(match.court_id)?.length ?? 0) > 0) {
      return;
    }

    const teams = getTeamsFromMatch(match).map((team) => {
      return {
        team: team.team,
        label:
          team.players
            .map((player) => {
              return player.name;
            })
            .join(" - ") || (team.team === "A" ? "TEAM A" : "TEAM B"),
        teamProfile: team.teamProfile,
      };
    });

    teamsByCourt.set(match.court_id, teams);
  });

  return teamsByCourt;
};

export const getCourtsOverviewData = async (): Promise<CourtsOverviewData> => {
  const supabase = createServerSupabaseClient();
  const adminSession = await getCurrentAdminSession();

  if (!adminSession) {
    return {
      ...fallbackOverviewData,
      courts: [],
    };
  }

  if (!supabase) {
    return {
      ...fallbackOverviewData,
      adminName: adminSession.adminName,
      courts: [],
    };
  }

  const { data, error } = await supabase
    .from("groups")
    .select("id,name,code,admin_name,admin_session_id,courts(id,court_number,status)")
    .eq("admin_session_id", adminSession.adminSessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<GroupRow>();

  if (error || !data) {
    return {
      ...fallbackOverviewData,
      adminName: adminSession.adminName,
      courts: [],
    };
  }

  const sortedCourts = (data.courts ?? []).sort((firstCourt, secondCourt) => {
    return firstCourt.court_number - secondCourt.court_number;
  });
  const courtIds = sortedCourts.map((court) => {
    return court.id;
  });
  const [playerCountsByCourt, activeTeamsByCourt] = await Promise.all([
    getPlayerCountsByCourt(courtIds),
    getActiveTeamsByCourt(courtIds),
  ]);
  const courts = sortedCourts
    .map((court) => {
      return {
        id: court.id,
        name: buildCourtName(court.court_number),
        number: court.court_number,
        status: normalizeCourtStatus(court.status),
        playerCount: playerCountsByCourt.get(court.id) ?? 0,
        teams: activeTeamsByCourt.get(court.id) ?? [],
      };
    });

  return {
    groupId: data.id,
    groupCode: data.code,
    groupLabel: "สนามทั้งหมด",
    adminName: adminSession.adminName,
    courtOptions: courts.map((court) => {
      return {
        id: court.id,
        name: court.name,
      };
    }),
    courts,
    isConnected: true,
  };
};

export const hasCurrentAdminGroup = async () => {
  const supabase = createServerSupabaseClient();
  const adminSession = await getCurrentAdminSession();

  if (!supabase || !adminSession) {
    return false;
  }

  const { data, error } = await supabase
    .from("groups")
    .select("id")
    .eq("admin_session_id", adminSession.adminSessionId)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error) {
    return false;
  }

  return Boolean(data);
};

export const getCourtDetailData = async (
  courtId: string
): Promise<CourtDetailData> => {
  const shellData = await getAdminGroupShellData();
  const adminName = shellData.adminName;
  const numericCourtId = Number(courtId);
  const court =
    Number.isFinite(numericCourtId) && courtId.trim() !== ""
      ? shellData.courts.find((currentCourt) => {
          return currentCourt.court_number === numericCourtId;
        }) ?? null
      : shellData.courts.find((currentCourt) => {
          return currentCourt.id === courtId;
        }) ?? null;

  const canAccessCourt = shellData.courtOptions.some((option) => {
    return option.id === court?.id;
  });

  if (!court?.group_id || !canAccessCourt) {
    return {
      courtId: courtId,
      groupId: null,
      groupCode: shellData.groupCode,
      courtName: Number.isFinite(numericCourtId)
        ? buildCourtName(numericCourtId)
        : "สนามที่ 1",
      adminName,
      courtOptions: shellData.courtOptions,
      currentPlayerCount: 0,
      currentMatch: null,
      players: [],
      queuedPlayers: [],
      isConnected: false,
    };
  }

  const [courtPlayerCount, currentMatch, queuedPlayers] = await Promise.all([
    getCourtPlayerCount(court.id),
    getCurrentMatchByCourt(court.id),
    getQueuedPlayersByCourt(court.id),
  ]);
  const activeCourtPlayers =
    currentMatch?.teams.flatMap((team) => {
      return team.players;
    }) ?? [];

  return {
    courtId: court.id,
    groupId: court.group_id,
    groupCode: shellData.groupCode,
    courtName: buildCourtName(court.court_number),
    adminName,
    courtOptions: shellData.courtOptions,
    currentPlayerCount: courtPlayerCount,
    currentMatch,
    players: activeCourtPlayers,
    queuedPlayers,
    isConnected: true,
  };
};

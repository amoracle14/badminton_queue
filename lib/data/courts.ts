import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CourtSummary = {
  id: string;
  name: string;
  status: string;
  playerCount: number;
};

export type CourtsOverviewData = {
  groupId: string | null;
  groupLabel: string;
  courts: CourtSummary[];
  isConnected: boolean;
};

export type CourtDetailData = {
  courtId: string | null;
  groupId: string | null;
  courtName: string;
  currentPlayerCount: number;
  isConnected: boolean;
};

type CourtRow = {
  id: string;
  court_number: number;
  status: string;
};

type PlayerRow = {
  id: string;
  status: string;
};

type GroupRow = {
  id: string;
  name: string;
  code: string;
  courts: CourtRow[] | null;
  players: PlayerRow[] | null;
};

const fallbackOverviewData: CourtsOverviewData = {
  groupId: null,
  groupLabel: "สนามทั้งหมด",
  courts: [
    {
      id: "1",
      name: "สนามที่ 1",
      status: "idle",
      playerCount: 0,
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

export const getCourtsOverviewData = async (): Promise<CourtsOverviewData> => {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return fallbackOverviewData;
  }

  const { data, error } = await supabase
    .from("groups")
    .select("id,name,code,courts(id,court_number,status),players(id,status)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<GroupRow>();

  if (error || !data) {
    return fallbackOverviewData;
  }

  const players = data.players ?? [];
  const courts = (data.courts ?? [])
    .sort((firstCourt, secondCourt) => {
      return firstCourt.court_number - secondCourt.court_number;
    })
    .map((court) => {
      return {
        id: court.id,
        name: buildCourtName(court.court_number),
        status: normalizeCourtStatus(court.status),
        playerCount: players.length,
      };
    });

  return {
    groupId: data.id,
    groupLabel: "สนามทั้งหมด",
    courts: courts.length > 0 ? courts : fallbackOverviewData.courts,
    isConnected: true,
  };
};

const getCourtById = async (courtId: string) => {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("courts")
    .select("id,group_id,court_number,status,groups(id,name,players(id,status))")
    .eq("id", courtId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
};

const getCourtByNumberFromLatestGroup = async (courtNumber: number) => {
  const overview = await getCourtsOverviewData();

  if (!overview.isConnected || !overview.groupId) {
    return null;
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("courts")
    .select("id,group_id,court_number,status,groups(id,name,players(id,status))")
    .eq("group_id", overview.groupId)
    .eq("court_number", courtNumber)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
};

export const getCourtDetailData = async (
  courtId: string
): Promise<CourtDetailData> => {
  const numericCourtId = Number(courtId);
  const court =
    Number.isFinite(numericCourtId) && courtId.trim() !== ""
      ? await getCourtByNumberFromLatestGroup(numericCourtId)
      : await getCourtById(courtId);

  if (!court) {
    return {
      courtId: courtId,
      groupId: null,
      courtName: Number.isFinite(numericCourtId)
        ? buildCourtName(numericCourtId)
        : "สนามที่ 1",
      currentPlayerCount: 0,
      isConnected: false,
    };
  }

  const group = Array.isArray(court.groups) ? court.groups[0] : court.groups;
  const players = group?.players ?? [];

  return {
    courtId: court.id,
    groupId: court.group_id,
    courtName: buildCourtName(court.court_number),
    currentPlayerCount: players.length,
    isConnected: true,
  };
};

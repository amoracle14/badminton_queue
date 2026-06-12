"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import {
  ADMIN_NAME_COOKIE,
  ADMIN_SESSION_COOKIE,
  normalizeAdminName,
} from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ActionState = {
  ok: boolean;
  message: string | null;
};

const errorState = (message: string): ActionState => {
  return {
    ok: false,
    message,
  };
};

const getText = (formData: FormData, key: string) => {
  return String(formData.get(key) ?? "").trim();
};

const setAdminSessionCookie = async (adminSessionId: string) => {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, adminSessionId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
};

export const loginWithName = async (
  _previousState: ActionState,
  formData: FormData
) => {
  const adminName = normalizeAdminName(getText(formData, "adminName"));

  if (adminName.length < 2) {
    return errorState("กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร");
  }

  const cookieStore = await cookies();
  const adminSessionId = randomUUID();

  cookieStore.set(ADMIN_NAME_COOKIE, encodeURIComponent(adminName), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  await setAdminSessionCookie(adminSessionId);

  redirect("/home");
};

export const createGroup = async (
  _previousState: ActionState,
  formData: FormData
) => {
  const cookieStore = await cookies();
  const adminName = normalizeAdminName(
    decodeURIComponent(cookieStore.get(ADMIN_NAME_COOKIE)?.value ?? "")
  );
  let adminSessionId = cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? "";

  if (!adminName) {
    redirect("/");
  }

  if (!adminSessionId) {
    adminSessionId = randomUUID();
    await setAdminSessionCookie(adminSessionId);
  }

  const venueName = getText(formData, "venueName");
  const groupName = getText(formData, "groupName");
  const description = getText(formData, "description");
  const courtNumberRaw = getText(formData, "courtNumber");
  const scheduledAt = getText(formData, "scheduledAt");
  const durationHoursRaw = getText(formData, "durationHours");
  const highScoreMode = formData.get("highScoreMode") === "on";
  const courtNumber = Number(courtNumberRaw);
  const durationHours = Number(durationHoursRaw);

  if (!venueName || !groupName || !description || !scheduledAt) {
    return errorState("กรุณากรอกข้อมูลให้ครบ");
  }

  if (!Number.isInteger(courtNumber) || courtNumber < 1 || courtNumber > 99) {
    return errorState("หมายเลขคอร์ทต้องเป็นตัวเลข 1-99");
  }

  if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > 24) {
    return errorState("จำนวนชั่วโมงต้องอยู่ระหว่าง 1-24 ชั่วโมง");
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return errorState("ยังไม่ได้ตั้งค่า Supabase environment");
  }

  const { error } = await supabase.rpc("create_admin_group_with_court", {
    p_admin_name: adminName,
    p_admin_session_id: adminSessionId,
    p_venue_name: venueName,
    p_group_name: groupName,
    p_description: description,
    p_court_number: courtNumber,
    p_scheduled_at: scheduledAt,
    p_duration_hours: durationHours,
    p_high_score_mode: highScoreMode,
  });

  if (error) {
    return errorState(error.message);
  }

  revalidatePath("/admin");
  redirect("/admin");
};

export const addCourtToCurrentGroup = async (
  _previousState: ActionState,
  formData: FormData
) => {
  const cookieStore = await cookies();
  const adminName = normalizeAdminName(
    decodeURIComponent(cookieStore.get(ADMIN_NAME_COOKIE)?.value ?? "")
  );
  let adminSessionId = cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? "";
  const groupId = getText(formData, "groupId");
  const courtNumber = Number(getText(formData, "courtNumber"));
  const scheduledAt = getText(formData, "scheduledAt");
  const durationHours = Number(getText(formData, "durationHours"));

  if (!adminName) {
    redirect("/");
  }

  if (!adminSessionId) {
    adminSessionId = randomUUID();
    await setAdminSessionCookie(adminSessionId);
  }

  if (!groupId || !scheduledAt) {
    return errorState("กรุณากรอกข้อมูลสนามให้ครบ");
  }

  if (!Number.isInteger(courtNumber) || courtNumber < 1 || courtNumber > 99) {
    return errorState("หมายเลขคอร์ทต้องเป็นตัวเลข 1-99");
  }

  if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > 24) {
    return errorState("จำนวนชั่วโมงต้องอยู่ระหว่าง 1-24 ชั่วโมง");
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return errorState("ยังไม่ได้ตั้งค่า Supabase environment");
  }

  const { error } = await supabase.rpc("add_admin_court_booking", {
    p_admin_name: adminName,
    p_admin_session_id: adminSessionId,
    p_group_id: groupId,
    p_court_number: courtNumber,
    p_scheduled_at: scheduledAt,
    p_duration_hours: durationHours,
  });

  if (error) {
    return errorState(error.message);
  }

  revalidatePath("/admin");

  return {
    ok: true,
    message: null,
  };
};

import { cookies } from "next/headers";

export const ADMIN_NAME_COOKIE = "acecourt_admin_name";
export const ADMIN_SESSION_COOKIE = "acecourt_admin_session";

export const normalizeAdminName = (name: string) => {
  return name.trim().replace(/\s+/g, " ");
};

export const getCurrentAdminName = async () => {
  const cookieStore = await cookies();
  const adminName = cookieStore.get(ADMIN_NAME_COOKIE)?.value;

  if (!adminName) {
    return null;
  }

  const decodedName = decodeURIComponent(adminName);
  const normalizedName = normalizeAdminName(decodedName);

  return normalizedName.length > 0 ? normalizedName : null;
};

export const getCurrentAdminSession = async () => {
  const cookieStore = await cookies();
  const adminName = await getCurrentAdminName();
  const adminSessionId = cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;

  if (!adminName || !adminSessionId) {
    return null;
  }

  return {
    adminName,
    adminSessionId,
  };
};

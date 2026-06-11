import { cookies } from "next/headers";

export const ADMIN_NAME_COOKIE = "acecourt_admin_name";

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

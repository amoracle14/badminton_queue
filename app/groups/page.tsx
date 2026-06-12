import { redirect } from "next/navigation";
import GroupEntryScreen from "@/components/groups/GroupEntryScreen";
import { getCurrentAdminName } from "@/lib/session";

export const dynamic = "force-dynamic";

const GroupsPage = async () => {
  const adminName = await getCurrentAdminName();

  if (!adminName) {
    redirect("/");
  }

  return <GroupEntryScreen />;
};

export default GroupsPage;

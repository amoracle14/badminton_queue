import { redirect } from "next/navigation";
import CreateGroupScreen from "@/components/groups/CreateGroupScreen";
import { getCurrentAdminName } from "@/lib/session";

export const dynamic = "force-dynamic";

const NewGroupPage = async () => {
  const adminName = await getCurrentAdminName();

  if (!adminName) {
    redirect("/");
  }

  return <CreateGroupScreen />;
};

export default NewGroupPage;

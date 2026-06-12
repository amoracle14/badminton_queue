import { redirect } from "next/navigation";
import RecoverGroupScreen from "@/components/groups/RecoverGroupScreen";
import { getCurrentAdminName } from "@/lib/session";

export const dynamic = "force-dynamic";

const RecoverGroupPage = async () => {
  const adminName = await getCurrentAdminName();

  if (!adminName) {
    redirect("/");
  }

  return <RecoverGroupScreen />;
};

export default RecoverGroupPage;

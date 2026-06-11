import { redirect } from "next/navigation";
import HomeMenuScreen from "@/components/home/HomeMenuScreen";
import { getCurrentAdminName } from "@/lib/session";

export const dynamic = "force-dynamic";

const HomePage = async () => {
  const adminName = await getCurrentAdminName();

  if (!adminName) {
    redirect("/");
  }

  return <HomeMenuScreen adminName={adminName} />;
};

export default HomePage;

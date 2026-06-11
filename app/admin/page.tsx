import { redirect } from "next/navigation";
import CourtsOverviewScreen from "@/components/admin/courts/CourtsOverviewScreen";
import { getCourtsOverviewData } from "@/lib/admin/courts";
import { getCurrentAdminName } from "@/lib/session";

export const dynamic = "force-dynamic";

const AdminHomePage = async () => {
  const adminName = await getCurrentAdminName();

  if (!adminName) {
    redirect("/");
  }

  const overviewData = await getCourtsOverviewData();

  return <CourtsOverviewScreen data={overviewData} />;
};

export default AdminHomePage;

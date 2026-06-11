import CourtsOverviewScreen from "@/components/admin/courts/CourtsOverviewScreen";
import { getCourtsOverviewData } from "@/lib/admin/courts";

export const dynamic = "force-dynamic";

const AdminHomePage = async () => {
  const overviewData = await getCourtsOverviewData();

  return <CourtsOverviewScreen data={overviewData} />;
};

export default AdminHomePage;

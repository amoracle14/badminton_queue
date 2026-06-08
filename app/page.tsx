import CourtsOverviewScreen from "@/components/courts/CourtsOverviewScreen";
import { getCourtsOverviewData } from "@/lib/data/courts";

export const dynamic = "force-dynamic";

const Home = async () => {
  const overviewData = await getCourtsOverviewData();

  return <CourtsOverviewScreen data={overviewData} />;
};

export default Home;

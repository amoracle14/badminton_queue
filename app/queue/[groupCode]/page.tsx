import UserQueueScreen from "@/components/user/UserQueueScreen";
import { getUserQueueDataByCode } from "@/lib/user/queue";

export const dynamic = "force-dynamic";

type UserQueuePageProps = {
  params: Promise<{
    groupCode: string;
  }>;
  searchParams: Promise<{
    court?: string;
  }>;
};

const UserQueuePage = async ({ params, searchParams }: UserQueuePageProps) => {
  const { groupCode } = await params;
  const { court } = await searchParams;
  const queueData = await getUserQueueDataByCode(groupCode, court);

  return <UserQueueScreen data={queueData} />;
};

export default UserQueuePage;

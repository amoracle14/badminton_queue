import UserQueueScreen from "@/components/user/UserQueueScreen";

type UserQueuePageProps = {
  params: Promise<{
    groupCode: string;
  }>;
};

const UserQueuePage = async ({ params }: UserQueuePageProps) => {
  const { groupCode } = await params;

  return <UserQueueScreen groupCode={groupCode} />;
};

export default UserQueuePage;

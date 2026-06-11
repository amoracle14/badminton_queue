import JoinGroupScreen from "@/components/user/JoinGroupScreen";

type JoinGroupPageProps = {
  params: Promise<{
    groupCode: string;
  }>;
};

const JoinGroupPage = async ({ params }: JoinGroupPageProps) => {
  const { groupCode } = await params;

  return <JoinGroupScreen groupCode={groupCode} />;
};

export default JoinGroupPage;

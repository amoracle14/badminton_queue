import { redirect } from "next/navigation";

type JoinGroupPageProps = {
  params: Promise<{
    groupCode: string;
  }>;
};

const JoinGroupPage = async ({ params }: JoinGroupPageProps) => {
  const { groupCode } = await params;

  redirect(`/queue/${groupCode}`);
};

export default JoinGroupPage;

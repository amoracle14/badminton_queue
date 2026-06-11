import { redirect } from "next/navigation";

type LegacyCourtPageProps = {
  params: Promise<{
    courtId: string;
  }>;
};

const LegacyCourtPage = async ({ params }: LegacyCourtPageProps) => {
  const { courtId } = await params;

  redirect(`/admin/courts/${courtId}`);
};

export default LegacyCourtPage;

import { redirect } from "next/navigation";
import CourtDetailScreen from "@/components/admin/courts/CourtDetailScreen";
import { getCourtDetailData } from "@/lib/admin/courts";
import { getCurrentAdminName } from "@/lib/session";

export const dynamic = "force-dynamic";

type CourtPageProps = {
  params: Promise<{
    courtId: string;
  }>;
};

const CourtPage = async ({ params }: CourtPageProps) => {
  const adminName = await getCurrentAdminName();

  if (!adminName) {
    redirect("/");
  }

  const { courtId } = await params;
  const courtData = await getCourtDetailData(courtId);

  return <CourtDetailScreen data={courtData} />;
};

export default CourtPage;

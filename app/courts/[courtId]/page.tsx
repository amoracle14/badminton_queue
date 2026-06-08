import CourtDetailScreen from "@/components/courts/CourtDetailScreen";

type CourtPageProps = {
  params: Promise<{
    courtId: string;
  }>;
};

export default async function CourtPage({ params }: CourtPageProps) {
  const { courtId } = await params;

  return <CourtDetailScreen courtName={`สนามที่ ${courtId}`} />;
}

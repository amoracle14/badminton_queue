"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MobileAppShell from "@/components/admin/layout/MobileAppShell";
import TopCourtBar from "@/components/admin/layout/TopCourtBar";
import CourtCard from "@/components/admin/courts/CourtCard";
import AddCourtModal from "@/components/admin/courts/AddCourtModal";
import type { CourtsOverviewData } from "@/lib/admin/courts";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type CourtsOverviewScreenProps = {
  data: CourtsOverviewData;
};

const CourtsOverviewScreen = ({ data }: CourtsOverviewScreenProps) => {
  const router = useRouter();
  const [isAddCourtOpen, setIsAddCourtOpen] = useState(false);
  const [, startTransition] = useTransition();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 450);
  }, [router]);

  useEffect(() => {
    if (!data.groupId) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`courts-overview:${data.groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `group_id=eq.${data.groupId}`,
        },
        () => {
          scheduleRefresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "courts",
          filter: `group_id=eq.${data.groupId}`,
        },
        () => {
          scheduleRefresh();
        }
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [data.groupId, scheduleRefresh]);

  return (
    <MobileAppShell>
      <TopCourtBar
        label={data.groupLabel}
        courtOptions={data.courtOptions}
        includeAllOption
        groupCode={data.groupCode}
      />

      <section className="px-4 pt-[22px]">
        <div className="mb-[19px] flex items-center justify-between">
          <h1 className="text-[16px] font-normal text-[#303030]">สนาม</h1>
          <button
            type="button"
            onClick={() => {
              setIsAddCourtOpen(true);
            }}
            className="flex items-center gap-[6px] text-[16px] font-medium leading-none text-[var(--color-primary)]"
          >
            <Image
              src="/icons/add.svg"
              alt=""
              width={16}
              height={16}
              className="contrast-125 saturate-150"
            />
            เพิ่มสนาม
          </button>
        </div>

        <div className="space-y-4">
          {data.courts.length > 0 ? (
            data.courts.map((court) => {
              return (
                <CourtCard
                  key={court.id}
                  id={court.id}
                  name={court.name}
                  status={court.status}
                  playerCount={court.playerCount}
                  teams={court.teams}
                />
              );
            })
          ) : (
            <div className="rounded-[14px] bg-white px-5 py-10 text-center shadow-[0_10px_32px_rgba(64,169,255,0.08)]">
              <p className="text-[17px] font-bold text-[var(--color-text)]">
                ยังไม่มีก๊วนหรือสนาม
              </p>
              <p className="mt-2 text-[14px] text-[#989898]">
                เริ่มจากสร้างแก๊ง&ก๊วน หรือเพิ่มสนามหลังสร้างก๊วนแล้ว
              </p>
            </div>
          )}
        </div>
      </section>

      {isAddCourtOpen ? (
        <AddCourtModal
          groupId={data.groupId}
          onClose={() => {
            setIsAddCourtOpen(false);
          }}
          onSaved={() => {
            setIsAddCourtOpen(false);
            scheduleRefresh();
          }}
        />
      ) : null}
    </MobileAppShell>
  );
};

export default CourtsOverviewScreen;

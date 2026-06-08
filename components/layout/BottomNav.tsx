import Image from "next/image";
import Link from "next/link";

const navItems = [
  {
    href: "/",
    icon: "/icons/nav-apps.svg",
    label: "สนามทั้งหมด",
    active: true,
  },
  {
    href: "/players",
    icon: "/icons/nav-user.svg",
    label: "รายชื่อผู้เล่น",
    active: false,
  },
  {
    href: "/history",
    icon: "/icons/nav-clock.svg",
    label: "ประวัติการเล่น",
    active: false,
  },
  {
    href: "/dashboard",
    icon: "/icons/nav-dashboard.svg",
    label: "Dashboard",
    active: false,
  },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto h-[88px] w-full max-w-[440px] rounded-t-[14px] bg-white shadow-[0_-8px_28px_rgba(64,169,255,0.08)]">
      <div className="grid h-full grid-cols-4 px-3 pt-[14px]">
        {navItems.map(function renderNavItem(item) {
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-[6px] text-center"
            >
              <Image
                src={item.icon}
                alt=""
                width={24}
                height={24}
                className={item.active ? "" : "opacity-70 grayscale"}
              />
              <span
                className={
                  item.active
                    ? "text-[12px] font-semibold leading-none text-[#1597F5]"
                    : "text-[12px] font-normal leading-none text-[#666666]"
                }
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

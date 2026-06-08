type MobileAppShellProps = {
  children: React.ReactNode;
};

export default function MobileAppShell({ children }: MobileAppShellProps) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[440px] bg-[#FBFFFF] pb-[104px] pt-4 font-sans">
      {children}
    </main>
  );
}

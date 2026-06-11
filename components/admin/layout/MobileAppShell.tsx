type MobileAppShellProps = {
  children: React.ReactNode;
  fullBleed?: boolean;
};

const MobileAppShell = ({ children, fullBleed = false }: MobileAppShellProps) => {
  return (
    <main
      className={
        fullBleed
          ? "mx-auto min-h-dvh w-full max-w-[440px] bg-[#FBFFFF] pb-8 font-sans"
          : "mx-auto min-h-dvh w-full max-w-[440px] bg-[#FBFFFF] pb-8 pt-4 font-sans"
      }
    >
      {children}
    </main>
  );
};

export default MobileAppShell;

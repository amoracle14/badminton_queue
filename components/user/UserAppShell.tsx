type UserAppShellProps = {
  children: React.ReactNode;
};

const UserAppShell = ({ children }: UserAppShellProps) => {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[440px] bg-[#FBFFFF] px-4 py-6 font-sans">
      {children}
    </main>
  );
};

export default UserAppShell;

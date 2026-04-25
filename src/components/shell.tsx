type ShellProps = {
  children: React.ReactNode;
};

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7,transparent_30%),linear-gradient(180deg,#fffaf2_0%,#f8fafc_60%,#eef2ff_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

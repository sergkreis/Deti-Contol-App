type LogoutButtonProps = {
  action: () => Promise<void>;
  label: string;
};

export function LogoutButton({ action, label }: LogoutButtonProps) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
      >
        {label}
      </button>
    </form>
  );
}

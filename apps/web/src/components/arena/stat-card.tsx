export function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
      <span className="text-sm leading-none opacity-60">{icon}</span>
      <span className="text-base font-bold leading-none text-white/90">{value}</span>
      <span className="text-[0.6rem] uppercase tracking-widest text-cyan-200/40">{label}</span>
    </div>
  );
}

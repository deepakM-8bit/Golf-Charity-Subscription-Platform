const STATUS_STYLES = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  lapsed: "bg-red-500/10 text-red-400 border-red-500/30",
  inactive: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
};

const SubscriptionBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.inactive;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${style}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status?.charAt(0).toUpperCase() + status?.slice(1) || "Inactive"}
    </span>
  );
};

export default SubscriptionBadge;

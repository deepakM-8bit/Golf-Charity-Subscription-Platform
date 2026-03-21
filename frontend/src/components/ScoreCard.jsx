import { Pencil, Trash2 } from "lucide-react";

const ScoreCard = ({ score, onEdit, onDelete = false }) => {
  const date = new Date(score.date_played).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // color based on score range
  const getScoreColor = (s) => {
    if (s >= 36) return "text-emerald-400";
    if (s >= 26) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all">
      <div className="flex items-center gap-4">
        <div
          className={`text-2xl font-extrabold ${getScoreColor(score.score)}`}
        >
          {score.score}
        </div>
        <div>
          <p className="text-xs text-zinc-500">Stableford Points</p>
          <p className="text-sm text-zinc-400">{date}</p>
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(score)}
              className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(score.id)}
              className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ScoreCard;

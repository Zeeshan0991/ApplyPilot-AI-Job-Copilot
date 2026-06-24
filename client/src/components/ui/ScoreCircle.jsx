function ScoreCircle({ score, label }) {
  const getColor = () => {
    if (score >= 80) return 'text-emerald-400 stroke-emerald-400';
    if (score >= 60) return 'text-blue-400 stroke-blue-400';
    if (score >= 40) return 'text-yellow-400 stroke-yellow-400';
    return 'text-red-400 stroke-red-400';
  };

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const gap = circumference - filled;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-white/10"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${gap}`}
            className={getColor()}
          />
        </svg>
        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${getColor().split(' ')[0]}`}>
            {score}
          </span>
          <span className="text-white/40 text-xs">/ 100</span>
        </div>
      </div>
      <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-white/5 ${getColor().split(' ')[0]}`}>
        {label}
      </span>
    </div>
  );
}

export default ScoreCircle;
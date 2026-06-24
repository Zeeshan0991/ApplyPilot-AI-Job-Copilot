// ════════════════════════════════════════════════════════════════
// SHARED APPLICATION SIGNALS
// Single source of truth for any "how urgent/idle is this application"
// logic. Previously this lived independently in both Pipeline.jsx
// (getMomentum) and ApplicationDossier.jsx (StatusBanner) with
// slightly different thresholds — easy to drift out of sync.
// Both files now import from here instead.
// ════════════════════════════════════════════════════════════════

export const daysSince = (dateString) => {
  const diff = Date.now() - new Date(dateString).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Thresholds, named once, used everywhere — change a number here
// and both the Pipeline and the Dossier banner update consistently.
export const IDLE_THRESHOLDS = {
  analyzed: 3,  // days before an unsubmitted analysis is flagged idle
  applied: 7,   // days before a no-response application prompts a follow-up
};

// ── Momentum — used by Pipeline's row-level indicator ───────────
export function getMomentum(app) {
  const idleDays = daysSince(app.updatedAt || app.createdAt);

  if (app.status === 'offered') return { label: 'Resolved', color: 'var(--emerald)', icon: '●' };
  if (app.status === 'rejected') return { label: 'Closed', color: 'var(--ink-faint)', icon: '●' };

  if (app.status === 'analyzed') {
    return idleDays > IDLE_THRESHOLDS.analyzed
      ? { label: `Idle ${idleDays}d — submit it`, color: 'var(--amber)', icon: '▾' }
      : { label: 'Fresh', color: 'var(--teal)', icon: '▴' };
  }

  if (app.status === 'applied') {
    return idleDays > IDLE_THRESHOLDS.applied
      ? { label: `No response ${idleDays}d — follow up`, color: 'var(--amber)', icon: '▾' }
      : { label: 'Waiting on response', color: 'var(--ink-dim)', icon: '·' };
  }

  if (app.status === 'interviewing') {
    return app.research?.companyOverview
      ? { label: 'Briefed and ready', color: 'var(--emerald)', icon: '▴' }
      : { label: 'Needs company intel', color: 'var(--amber)', icon: '▾' };
  }

  return { label: 'Tracking', color: 'var(--ink-faint)', icon: '·' };
}
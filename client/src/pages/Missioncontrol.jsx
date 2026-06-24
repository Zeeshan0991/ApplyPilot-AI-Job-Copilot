import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApplications } from '../services/api';

const STAGES = [
  { key: 'analyzed',     label: 'Analyzed',     color: 'var(--teal)'    },
  { key: 'applied',      label: 'Applied',      color: 'var(--amber)'   },
  { key: 'interviewing', label: 'Interviewing', color: '#A78BFA'        },
  { key: 'offered',      label: 'Offered',      color: 'var(--emerald)' },
  { key: 'rejected',     label: 'Rejected',     color: 'var(--ink-faint)' },
];

const scoreColor = (s) =>
  s >= 80 ? 'var(--emerald)' : s >= 60 ? 'var(--teal)' : s >= 40 ? 'var(--amber)' : 'var(--red)';

// ════════════════════════════════════════════════════════════════
// PIPELINE NAVIGATOR — left spine, vertical stage breakdown
// ════════════════════════════════════════════════════════════════
function PipelineSpine({ applications }) {
  const total = applications.length;

  return (
    <div className="panel" style={{ height: 'fit-content' }}>
      <span className="panel-label">Pipeline</span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {STAGES.map((stage) => {
          const count = applications.filter(a => a.status === stage.key).length;
          const pct = total > 0 ? (count / total) * 100 : 0;

          return (
            <Link
              key={stage.key}
              to="/pipeline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 8px',
                borderRadius: '6px',
                textDecoration: 'none',
                transition: `background var(--duration-transition) var(--ease-standard)`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="status-dot" style={{ background: stage.color }} />
              <span style={{
                flex: 1,
                fontSize: 'var(--text-body)',
                color: 'var(--ink-dim)',
                fontFamily: 'var(--font-body)',
              }}>
                {stage.label}
              </span>
              <span style={{
                fontFamily: 'var(--font-data)',
                fontSize: 'var(--text-caption)',
                color: 'var(--ink-faint)',
              }}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Mini bar showing distribution */}
      {total > 0 && (
        <div style={{
          display: 'flex',
          height: '4px',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '16px',
          background: 'var(--surface-raised)',
        }}>
          {STAGES.map((stage) => {
            const count = applications.filter(a => a.status === stage.key).length;
            const pct = total > 0 ? (count / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={stage.key}
                style={{ width: `${pct}%`, background: stage.color }}
              />
            );
          })}
        </div>
      )}

      <Link
        to="/new"
        className="action-secondary"
        style={{
          display: 'block',
          textAlign: 'center',
          textDecoration: 'none',
          padding: '10px',
          marginTop: '18px',
          fontSize: 'var(--text-caption)',
        }}
      >
        + New Application
      </Link>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PIPELINE HEALTH — single score + one recommendation
// ════════════════════════════════════════════════════════════════
function calculateHealth(applications) {
  if (applications.length === 0) return null;

  const total = applications.length;
  const avgScore = Math.round(
    applications.reduce((sum, a) => sum + (a.analysis?.matchScore || 0), 0) / total
  );
  const applied = applications.filter(a => ['applied', 'interviewing', 'offered'].includes(a.status)).length;
  const interviewing = applications.filter(a => a.status === 'interviewing').length;
  const analyzed = applications.filter(a => a.status === 'analyzed').length;

  // Simple composite — volume, quality, momentum
  const volumeScore = Math.min(applied * 12, 40);
  const qualityScore = Math.min(avgScore * 0.4, 40);
  const momentumScore = Math.min(interviewing * 10, 20);
  const health = Math.round(volumeScore + qualityScore + momentumScore);

  let recommendation;
  if (analyzed > applied) {
    recommendation = `You have ${analyzed} analyzed application${analyzed !== 1 ? 's' : ''} sitting idle. Submit them before momentum fades.`;
  } else if (interviewing === 0 && applied > 0) {
    recommendation = `${applied} application${applied !== 1 ? 's' : ''} out, no interviews yet. Consider following up or widening your search.`;
  } else if (interviewing > 0) {
    recommendation = `You have ${interviewing} active interview${interviewing !== 1 ? 's' : ''}. Prioritize prep time this week.`;
  } else {
    recommendation = `Pipeline is light. Run a new analysis to keep momentum going.`;
  }

  return { health, avgScore, recommendation };
}

function HealthGauge({ health }) {
  const radius = 46;
  const circ = 2 * Math.PI * radius;
  const filled = (health.health / 100) * circ;
  const color = health.health >= 70 ? 'var(--emerald)' : health.health >= 40 ? 'var(--teal)' : 'var(--amber)';

  return (
    <div style={{ position: 'relative', width: '108px', height: '108px', flexShrink: 0 }}>
      <svg width="108" height="108" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="54" cy="54" r={radius} fill="none" stroke="var(--surface-raised)" strokeWidth="6" />
        <circle
          cx="54" cy="54" r={radius} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          style={{ transition: `stroke-dasharray 800ms var(--ease-reveal)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: '26px', fontWeight: 500, color }}>
          {health.health}
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ACTIVE FOCUS ZONE — center column, the "what to do right now"
// ════════════════════════════════════════════════════════════════
function ActiveFocusZone({ applications }) {
  const health = calculateHealth(applications);

  // First-time / empty state
  if (applications.length === 0) {
    return (
      <div className="panel-focus reveal" style={{ textAlign: 'left' }}>
        <span className="panel-label">Mission Briefing</span>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-display)',
          fontWeight: 500,
          color: 'var(--ink)',
          lineHeight: 1.15,
          marginBottom: '14px',
        }}>
          Your operating system<br />for getting hired.
        </h1>
        <p style={{
          fontSize: 'var(--text-subhead)',
          color: 'var(--ink-dim)',
          lineHeight: 1.7,
          maxWidth: '480px',
          marginBottom: '28px',
        }}>
          No active missions yet. Bring a resume and a job description —
          ApplyPilot will match the score, tailor your materials, and brief
          you on the company before anyone else has done their homework.
        </p>
        <Link to="/new" className="action-primary" style={{
          display: 'inline-block', padding: '12px 24px',
          borderRadius: '8px', textDecoration: 'none',
        }}>
          Start your first mission →
        </Link>
      </div>
    );
  }

  // Active state — show health + recommendation
  return (
    <div className="panel reveal">
      <span className="panel-label">Active Focus</span>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '20px' }}>
        <HealthGauge health={health} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--ink-faint)', marginBottom: '4px' }}>
            Pipeline Health
          </p>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            color: 'var(--ink)',
            lineHeight: 1.4,
            fontWeight: 500,
          }}>
            {health.recommendation}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Link to="/new" className="action-primary" style={{
          padding: '10px 18px', borderRadius: '8px', textDecoration: 'none', fontSize: 'var(--text-body)',
        }}>
          + New Application
        </Link>
        <Link to="/pipeline" className="action-secondary" style={{
          padding: '10px 18px', borderRadius: '8px', textDecoration: 'none', fontSize: 'var(--text-body)',
        }}>
          View Pipeline
        </Link>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PRIORITY TASKS — beneath focus zone, specific next actions
// ════════════════════════════════════════════════════════════════
function PriorityTasks({ applications }) {
  const tasks = [];

  applications.forEach(app => {
    if (app.status === 'analyzed') {
      tasks.push({
        id: app._id,
        label: `Submit application — ${app.jobTitle} at ${app.company}`,
        meta: `${app.analysis?.matchScore}/100 match`,
        color: scoreColor(app.analysis?.matchScore),
      });
    }
    if (app.status === 'interviewing' && !app.research?.companyOverview) {
      tasks.push({
        id: app._id,
        label: `Run company research — ${app.company}`,
        meta: 'Interview prep incomplete',
        color: 'var(--amber)',
      });
    }
  });

  if (tasks.length === 0) return null;

  return (
    <div className="panel reveal" style={{ animationDelay: '120ms' }}>
      <span className="panel-label">Priority Tasks</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {tasks.slice(0, 4).map((task, i) => (
          <Link
            key={task.id + i}
            to="/pipeline"
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 8px', textDecoration: 'none',
              borderTop: i > 0 ? '1px solid var(--line)' : 'none',
            }}
          >
            <span className="status-dot" style={{ background: task.color }} />
            <span style={{ flex: 1, fontSize: 'var(--text-body)', color: 'var(--ink)' }}>
              {task.label}
            </span>
            <span style={{
              fontFamily: 'var(--font-data)', fontSize: 'var(--text-micro)',
              color: 'var(--ink-faint)',
            }}>
              {task.meta}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SIGNAL FEED — right column, chronological intelligence feed
// ════════════════════════════════════════════════════════════════
function SignalFeed({ applications }) {
  // Build a feed from what we actually have — recent applications + research
  const signals = [...applications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)
    .map(app => {
      if (app.research?.companyOverview) {
        return {
          id: app._id + '-research',
          type: 'research',
          text: `Company brief ready for ${app.company}`,
          time: app.updatedAt,
        };
      }
      return {
        id: app._id + '-analysis',
        type: 'analysis',
        text: `${app.jobTitle} at ${app.company} scored ${app.analysis?.matchScore}/100`,
        time: app.createdAt,
      };
    });

  return (
    <div className="panel" style={{ height: 'fit-content' }}>
      <span className="panel-label">Signal Feed</span>

      {signals.length === 0 ? (
        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--ink-faint)', lineHeight: 1.6 }}>
          Signals will appear here as you analyze applications and research companies.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {signals.map((signal) => (
            <div key={signal.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{
                fontFamily: 'var(--font-data)',
                fontSize: '13px',
                color: signal.type === 'research' ? 'var(--teal)' : 'var(--ink-faint)',
                marginTop: '1px',
              }}>
                {signal.type === 'research' ? '◉' : '·'}
              </span>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--ink-dim)', lineHeight: 1.55 }}>
                {signal.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN — MISSION CONTROL
// ════════════════════════════════════════════════════════════════
function MissionControl() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApplications()
      .then(res => setApplications(res.data))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-caption)', color: 'var(--ink-faint)' }}>
          Loading mission data...
        </span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* Top identity strip */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{
          fontFamily: 'var(--font-data)', fontSize: 'var(--text-micro)',
          color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Mission Control
        </span>
      </div>

      {/* Three-zone layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr 260px',
        gap: '20px',
        alignItems: 'start',
      }}
      className="mission-grid"
      >
        <PipelineSpine applications={applications} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ActiveFocusZone applications={applications} />
          <PriorityTasks applications={applications} />
        </div>

        <SignalFeed applications={applications} />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .mission-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default MissionControl;
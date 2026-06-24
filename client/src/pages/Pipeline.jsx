import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApplications, deleteApplication } from '../services/api';
import { getMomentum } from '../utils/applicationSignals';

const STAGES = [
  { key: 'analyzed',     label: 'Analyzed',     color: 'var(--teal)'      },
  { key: 'applied',      label: 'Applied',       color: 'var(--amber)'    },
  { key: 'interviewing', label: 'Interviewing',  color: '#A78BFA'         },
  { key: 'offered',      label: 'Offered',       color: 'var(--emerald)'  },
  { key: 'rejected',     label: 'Rejected',      color: 'var(--ink-faint)'},
];

const scoreColor = (s) =>
  s >= 80 ? 'var(--emerald)' : s >= 60 ? 'var(--teal)' : s >= 40 ? 'var(--amber)' : 'var(--red)';

// ════════════════════════════════════════════════════════════════
// PORTFOLIO SUMMARY — the strategic overview strip, leads the page
// ════════════════════════════════════════════════════════════════
function PortfolioSummary({ applications }) {
  const total = applications.length;
  const avgScore = total > 0
    ? Math.round(applications.reduce((sum, a) => sum + (a.analysis?.matchScore || 0), 0) / total)
    : 0;
  const needsAttention = applications.filter(a => {
    const m = getMomentum(a);
    return m.icon === '▾';
  }).length;
  const interviewing = applications.filter(a => a.status === 'interviewing').length;

  const metrics = [
    { label: 'Total Applications', value: total, color: 'var(--ink)' },
    { label: 'Avg Match Score',    value: avgScore, color: scoreColor(avgScore) },
    { label: 'Active Interviews',  value: interviewing, color: '#A78BFA' },
    { label: 'Need Attention',     value: needsAttention, color: needsAttention > 0 ? 'var(--amber)' : 'var(--ink-faint)' },
  ];
return (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  }}>
    {metrics.map((m) => (
      <div key={m.label} style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--line-bright)',
        borderRadius: '8px',
        padding: '16px 20px',
      }}>
        <p style={{
          fontFamily: 'var(--font-data)',
          fontSize: '32px',
          fontWeight: 500,
          color: m.color,
          lineHeight: 1,
          marginBottom: '8px',
        }}>
          {m.value}
        </p>
        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--ink-faint)' }}>
          {m.label}
        </p>
      </div>
    ))}
  </div>
);

}

// ════════════════════════════════════════════════════════════════
// APPLICATION ROW — dense, scannable, not a floating card
// ════════════════════════════════════════════════════════════════
function ApplicationRow({ app, onDelete, onOpen }) {
  const [confirming, setConfirming] = useState(false);
  const stage = STAGES.find(s => s.key === app.status);
  const momentum = getMomentum(app);

  return (
    <div
  onClick={() => onOpen(app._id)}
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 90px 160px 200px 70px',
    gap: '16px',
    alignItems: 'center',
    padding: '14px 16px 14px 20px',
    borderBottom: '1px solid var(--line)',
    borderLeft: `3px solid ${stage?.color || 'transparent'}`,
    cursor: 'pointer',
    transition: 'background var(--duration-transition) var(--ease-standard)',
  }}
  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
>
      {/* Role + Company */}
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--ink)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {app.jobTitle}
        </p>
        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--ink-faint)', marginTop: '2px' }}>
          {app.company}
        </p>
      </div>

      {/* Score */}
      <div style={{
        fontFamily: 'var(--font-data)', fontSize: '17px', fontWeight: 500,
        color: scoreColor(app.analysis?.matchScore), textAlign: 'center',
      }}>
        {app.analysis?.matchScore ?? '—'}
      </div>

      {/* Stage */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="status-dot" style={{ background: stage?.color }} />
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--ink-dim)' }}>{stage?.label}</span>
      </div>

      {/* Momentum */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', color: momentum.color }}>{momentum.icon}</span>
        <span style={{ fontSize: 'var(--text-caption)', color: momentum.color }}>{momentum.label}</span>
      </div>

      {/* Delete */}
      <div onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            style={{
              background: 'transparent', border: 'none', color: 'var(--ink-faint)',
              cursor: 'pointer', fontSize: '13px', padding: '4px 8px',
            }}
          >
            ✕
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => onDelete(app._id)}
              style={{
                background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)',
                cursor: 'pointer', fontSize: '11px', padding: '4px 8px', borderRadius: '5px',
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{
                background: 'transparent', border: '1px solid var(--line-bright)', color: 'var(--ink-faint)',
                cursor: 'pointer', fontSize: '11px', padding: '4px 8px', borderRadius: '5px',
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// STAGE GROUP — applications clustered under a stage header
// ════════════════════════════════════════════════════════════════
function StageGroup({ stage, applications, onDelete, onOpen }) {
  if (applications.length === 0) return null;

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: '12px' }}>
      <div className="stage-header-accent" style={{ '--accent-color': stage.color, display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid var(--line)',
        background: 'var(--surface-raised)',
      }}>
        <span className="status-dot" style={{ background: stage.color }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
          {stage.label}
        </span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: '11px', color: 'var(--ink-faint)' }}>
          {applications.length}
        </span>
      </div>
      <div>
        {applications.map(app => (
          <ApplicationRow key={app._id} app={app} onDelete={onDelete} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN — PIPELINE
// ════════════════════════════════════════════════════════════════
function Pipeline() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getApplications()
      .then(res => setApplications(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteApplication(id);
      setApplications(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpen = (id) => navigate(`/applications/${id}`);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-caption)', color: 'var(--ink-faint)' }}>
          Loading pipeline...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
        <p style={{ color: 'var(--red)', fontSize: 'var(--text-body)' }}>⚠ {error}</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', textAlign: 'center', gap: '14px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'var(--ink)' }}>
          No applications in the pipeline yet.
        </p>
        <p style={{ fontSize: 'var(--text-body)', color: 'var(--ink-faint)', maxWidth: '360px' }}>
          Run your first analysis to start building your portfolio.
        </p>
        <Link to="/new" className="action-primary" style={{ padding: '11px 22px', borderRadius: '8px', textDecoration: 'none' }}>
          Analyze a job →
        </Link>
      </div>
    );
  }

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px 80px' }}>

      <div style={{ marginBottom: '20px' }}>
        <span style={{
          fontFamily: 'var(--font-data)', fontSize: 'var(--text-micro)',
          color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Pipeline
        </span>
      </div>

      <PortfolioSummary applications={applications} />

      {/* Filter row */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            fontSize: 'var(--text-caption)', padding: '6px 14px', borderRadius: '100px',
            border: `1px solid ${filter === 'all' ? 'var(--teal)' : 'var(--line)'}`,
            background: filter === 'all' ? 'var(--teal-dim)' : 'transparent',
            color: filter === 'all' ? 'var(--teal)' : 'var(--ink-faint)',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >
          All
        </button>
        {STAGES.map(stage => (
          <button
            key={stage.key}
            onClick={() => setFilter(stage.key)}
            style={{
              fontSize: 'var(--text-caption)', padding: '6px 14px', borderRadius: '100px',
              border: `1px solid ${filter === stage.key ? stage.color : 'var(--line)'}`,
              background: filter === stage.key ? `${stage.color}18` : 'transparent',
              color: filter === stage.key ? stage.color : 'var(--ink-faint)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            {stage.label} ({applications.filter(a => a.status === stage.key).length})
          </button>
        ))}
      </div>

      {/* Grouped or flat list depending on filter */}
      {filter === 'all' ? (
        STAGES.map(stage => (
          <StageGroup
            key={stage.key}
            stage={stage}
            applications={filtered.filter(a => a.status === stage.key)}
            onDelete={handleDelete}
            onOpen={handleOpen}
          />
        ))
      ) : (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map(app => (
            <ApplicationRow key={app._id} app={app} onDelete={handleDelete} onOpen={handleOpen} />
          ))}
        </div>
      )}
    </div>
  );
}


export default Pipeline;
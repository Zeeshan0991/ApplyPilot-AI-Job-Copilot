import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeApplication } from '../services/api';
import { useAuth } from '../context/AuthContext';

const scoreColor = (s) =>
  s >= 80 ? 'var(--emerald)' : s >= 60 ? 'var(--teal)' : s >= 40 ? 'var(--amber)' : 'var(--red)';

// ════════════════════════════════════════════════════════════════
// STRATEGIST SEQUENCE — the center pane's processing narration.
// Each line represents a real step the backend actually performs —
// this is not decorative, it's a status log of genuine work.
// ════════════════════════════════════════════════════════════════
const STRATEGIST_STEPS = [
  'Reading resume structure...',
  'Parsing job requirements...',
  'Scoring match against role...',
  'Identifying keyword gaps...',
  'Drafting tailored bullets...',
  'Writing cover letter...',
];

function StrategistLog({ stepIndex }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {STRATEGIST_STEPS.map((step, i) => {
        const done = i < stepIndex;
        const active = i === stepIndex;
        return (
          <div key={step} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            opacity: i <= stepIndex ? 1 : 0.3,
            transition: 'opacity 300ms var(--ease-standard)',
          }}>
            <span style={{
              width: '14px', fontFamily: 'var(--font-data)', fontSize: '12px',
              color: done ? 'var(--emerald)' : active ? 'var(--teal)' : 'var(--ink-faint)',
            }}>
              {done ? '✓' : active ? '◉' : '·'}
            </span>
            <span style={{
              fontFamily: 'var(--font-data)', fontSize: '12.5px',
              color: done ? 'var(--ink-dim)' : active ? 'var(--ink)' : 'var(--ink-faint)',
            }}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// AI STRATEGIST PANE — center column, three states:
// idle (awaiting input) → working (live log) → verdict (score preview)
// ════════════════════════════════════════════════════════════════
function StrategistPane({
  state,
  stepIndex,
  result,
  error,
  formReady,
  onOpenDossier,
  onRetry,
}) {
  // ── State: error ──
  if (state === 'error') {
    return (
      <div
        className="strategist-panel"
        style={{ borderColor: 'var(--red-dim)' }}
      >
        <span className="panel-label">Strategist — Error</span>

        <p
          style={{
            fontSize: 'var(--text-body)',
            color: 'var(--red)',
            lineHeight: 1.6,
            marginBottom: '16px',
          }}
        >
          {error}
        </p>

        <button
          onClick={onRetry}
          className="action-secondary"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  // ── State: verdict (analysis complete) ──
  if (state === 'done' && result) {
    const { analysis } = result;

    return (
      <div className="strategist-panel reveal">
        <span className="panel-label">Strategist Verdict</span>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '44px',
              fontWeight: 500,
              color: scoreColor(analysis.matchScore),
              lineHeight: 1,
            }}
          >
            {analysis.matchScore}
          </div>

          <div>
            <p
              style={{
                fontSize: 'var(--text-caption)',
                color: 'var(--ink-faint)',
              }}
            >
              Match Score
            </p>

            <p
              style={{
                fontSize: 'var(--text-body)',
                color: scoreColor(analysis.matchScore),
                fontWeight: 500,
              }}
            >
              {analysis.matchLabel}
            </p>
          </div>
        </div>

        <p
          style={{
            fontSize: 'var(--text-body)',
            color: 'var(--ink-dim)',
            lineHeight: 1.7,
            marginBottom: '20px',
          }}
        >
          {analysis.summary}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '24px',
          }}
        >
          {analysis.missingKeywords?.slice(0, 3).map((kw, i) => (
            <span
              key={i}
              style={{
                fontSize: 'var(--text-micro)',
                color: 'var(--amber)',
                background: 'var(--amber-dim)',
                padding: '3px 9px',
                borderRadius: '100px',
                fontFamily: 'var(--font-data)',
              }}
            >
              {kw}
            </span>
          ))}
        </div>

        <button
          onClick={onOpenDossier}
          className="action-primary"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
          }}
        >
          Open Full Dossier →
        </button>
      </div>
    );
  }

  // ── State: working (live strategist log) ──
  if (state === 'working') {
    return (
      <div className="strategist-panel">
        <span className="panel-label">Strategist — Working</span>
        <StrategistLog stepIndex={stepIndex} />
      </div>
    );
  }

  // ── State: idle (awaiting input) ──
  return (
    <div
      className="strategist-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '320px',
      }}
    >
      <span className="panel-label">Strategist</span>

      <div
        style={{
          textAlign: 'center',
          padding: '20px 0',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '19px',
            color: 'var(--ink-dim)',
            fontWeight: 500,
            marginBottom: '10px',
          }}
        >
          {formReady
            ? 'Ready when you are.'
            : 'Awaiting resume and role details.'}
        </p>

        <p
          style={{
            fontSize: 'var(--text-caption)',
            color: 'var(--ink-faint)',
            lineHeight: 1.6,
            maxWidth: '260px',
            margin: '0 auto',
          }}
        >
          {formReady
            ? 'Both panels look complete. Run the analysis to get your match score.'
            : 'Fill in your resume on the left and the role details on the right.'}
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN — CAREER INTELLIGENCE WORKSPACE
// ════════════════════════════════════════════════════════════════
function CareerIntelligence() {
  const navigate = useNavigate();
  const { user, saveResume } = useAuth();
  const [resume, setResume] = useState(user?.resume || '');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [savingResume, setSavingResume] = useState(false);
  const [resumeSaved, setResumeSaved] = useState(false);

  const [state, setState] = useState('idle'); // idle | working | done | error
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const stepTimer = useRef(null);

  const formReady = resume.trim() && jobTitle.trim() && company.trim() && jobDescription.trim();

  // Saves the current resume text to the user's profile so future
  // visits to this page pre-fill it automatically — no more re-pasting.
  const handleSaveResume = async () => {
    if (!resume.trim()) return;
    setSavingResume(true);
    try {
      await saveResume(resume);
      setResumeSaved(true);
      setTimeout(() => setResumeSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingResume(false);
    }
  };

  const runAnalysis = async () => {
    if (!formReady) return;
    setState('working');
    setStepIndex(0);
    setError(null);

    // Narrate progress while the real API call runs in parallel —
    // the steps are paced for cognition, not tied 1:1 to network timing
    stepTimer.current = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STRATEGIST_STEPS.length - 1));
    }, 650);

    try {
      const response = await analyzeApplication({ resume, jobTitle, company, jobDescription });
      clearInterval(stepTimer.current);
      setStepIndex(STRATEGIST_STEPS.length - 1);
      setResult(response.data);
      setState('done');
    } catch (err) {
      clearInterval(stepTimer.current);
      setError(err.message);
      setState('error');
    }
  };

  const handleOpenDossier = () => {
    if (!result?._id) return;
    navigate(`/applications/${result._id}`);
  };

  return (
    <div
      style={{ maxWidth: '1320px', margin: '0 auto', padding: '32px 24px 80px' }}
    >
      <div style={{ marginBottom: '24px' }}>
        <span style={{
          fontFamily: 'var(--font-data)', fontSize: 'var(--text-micro)',
          color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Career Intelligence
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px 1fr',
        gap: '16px',
        alignItems: 'start',
      }}
      className="workspace-grid"
      >

        {/* ── LEFT: Resume ── */}
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="panel-label" style={{ marginBottom: 0 }}>Resume</span>
            <button
              onClick={handleSaveResume}
              disabled={savingResume || !resume.trim()}
              className="action-secondary"
              style={{ padding: '4px 11px', fontSize: 'var(--text-micro)', borderRadius: '6px', marginBottom: '14px' }}
            >
              {resumeSaved ? '✓ Saved' : savingResume ? 'Saving...' : 'Save to profile'}
            </button>
          </div>
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="Paste your full resume as plain text..."
            rows={18}
            className="field"
            style={{ resize: 'none', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}
          />
        </div>

        {/* ── CENTER: AI Strategist ── */}
        <div style={{ position: 'sticky', top: '76px' }}>
          <StrategistPane
            state={state}
            stepIndex={stepIndex}
            result={result}
            error={error}
            formReady={formReady}
            onOpenDossier={handleOpenDossier}
            onRetry={runAnalysis}
          />

          {state !== 'done' && (
            <button
              onClick={runAnalysis}
              disabled={!formReady || state === 'working'}
              className="action-primary"
              style={{ width: '100%', padding: '13px', borderRadius: '8px', marginTop: '12px' }}
            >
              {state === 'working' ? 'Strategist working...' : 'Run Analysis →'}
            </button>
          )}
        </div>

        {/* ── RIGHT: Job Description ── */}
        <div className="panel">
          <span className="panel-label">Target Role</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Job title"
              className="field"
            />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company"
              className="field"
            />
          </div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description..."
            rows={15}
            className="field"
            style={{ resize: 'none', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .workspace-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default CareerIntelligence;
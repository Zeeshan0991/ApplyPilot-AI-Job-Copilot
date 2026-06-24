import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getApplicationById,
  researchApplication,
  updateApplicationStatus,
  updateApplicationContent,
} from "../services/api";
import { daysSince, IDLE_THRESHOLDS } from "../utils/applicationSignals";

const scoreColor = (s) =>
  s >= 80
    ? "var(--emerald)"
    : s >= 60
    ? "var(--teal)"
    : s >= 40
    ? "var(--amber)"
    : "var(--red)";

const STATUS_META = {
  analyzed:     { label: "Analyzed",     color: "var(--teal)"      },
  applied:      { label: "Applied",      color: "var(--amber)"     },
  interviewing: { label: "Interviewing", color: "#A78BFA"          },
  offered:      { label: "Offered",      color: "var(--emerald)"   },
  rejected:     { label: "Rejected",     color: "var(--ink-faint)" },
};

const SECTIONS = [
  { key: "overview",  label: "Match Overview",     shortcut: "1" },
  { key: "documents", label: "Resume & Cover",      shortcut: "2" },
  { key: "intel",     label: "Company Intel",       shortcut: "3" },
  { key: "interview", label: "Interview Readiness", shortcut: "4" },
];

// ════════════════════════════════════════════════════════════════
// COPY BUTTON
// ════════════════════════════════════════════════════════════════
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="action-secondary"
      style={{ padding: "5px 12px", fontSize: "var(--text-micro)", borderRadius: "6px" }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════
// STATUS BANNER — contextual strip, changes per stage
// ════════════════════════════════════════════════════════════════
function StatusBanner({ app, onSectionChange }) {
  const days = daysSince(app.updatedAt || app.createdAt);

  const banners = {
    analyzed: {
      bg: "rgba(45, 212, 191, 0.06)",
      border: "rgba(45, 212, 191, 0.2)",
      icon: "◎",
      iconColor: "var(--teal)",
      message: days > IDLE_THRESHOLDS.analyzed
        ? `Analysis complete ${days} days ago. Momentum fades the longer a strong match sits unsubmitted — consider applying soon.`
        : "Analysis complete. Your tailored resume bullets and cover letter are ready — submit this application before momentum fades.",
      action: "Review resume & cover letter",
      actionFn: () => onSectionChange("documents"),
    },
    applied: {
      bg: days > IDLE_THRESHOLDS.applied ? "rgba(245, 158, 11, 0.07)" : "rgba(245, 158, 11, 0.04)",
      border: days > IDLE_THRESHOLDS.applied ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.15)",
      icon: days > IDLE_THRESHOLDS.applied ? "▾" : "·",
      iconColor: "var(--amber)",
      message: days > IDLE_THRESHOLDS.applied
        ? `${days} days since you applied — no response yet. Consider following up or checking if the role is still open.`
        : `Applied ${days === 0 ? "today" : `${days} day${days !== 1 ? "s" : ""} ago`}. Most companies respond within 5–10 business days.`,
      action: days > IDLE_THRESHOLDS.applied ? "Review your cover letter to follow up" : null,
      actionFn: () => onSectionChange("documents"),
    },
    interviewing: {
      bg: "rgba(167, 139, 250, 0.06)",
      border: "rgba(167, 139, 250, 0.2)",
      icon: "▴",
      iconColor: "#A78BFA",
      message: app.research?.companyOverview
        ? "Company briefing is on file. Review your interview questions and talking points before your conversation."
        : "You have an active interview. Run company research now — knowing their recent news and culture signals makes the difference.",
      action: app.research?.companyOverview ? "Go to interview prep" : "Run company research now",
      actionFn: () => onSectionChange(app.research?.companyOverview ? "interview" : "intel"),
    },
    offered: {
      bg: "rgba(52, 211, 153, 0.06)",
      border: "rgba(52, 211, 153, 0.2)",
      icon: "●",
      iconColor: "var(--emerald)",
      message: "Offer received. Review the full dossier to prepare for negotiation — your match score and strengths are strong talking points.",
      action: "Review match overview",
      actionFn: () => onSectionChange("overview"),
    },
    // ── Rejected — now grounded in this application's actual data
    // instead of one static sentence regardless of score or gaps.
    rejected: (() => {
      const score = app.analysis?.matchScore;
      const missingCount = app.analysis?.missingKeywords?.length || 0;

      let message;
      if (score >= 80) {
        message = `This was a strong match (${score}/100) — a rejection at this score is often about timing, internal candidates, or factors outside your resume. Worth revisiting this company in a future cycle.`;
      } else if (missingCount > 0) {
        message = `Match score was ${score ?? "—"}/100, with ${missingCount} missing keyword${missingCount !== 1 ? "s" : ""} identified. Review what was missing — it tells you exactly what to strengthen for the next one.`;
      } else {
        message = `Match score was ${score ?? "—"}/100. Review the full match overview to see what could be strengthened for similar roles.`;
      }

      return {
        bg: "rgba(255,255,255,0.02)",
        border: "rgba(255,255,255,0.06)",
        icon: "●",
        iconColor: "var(--ink-faint)",
        message,
        action: "Review what was missing",
        actionFn: () => onSectionChange("overview"),
      };
    })(),
  };

  const b = banners[app.status];
  if (!b) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      padding: "12px 16px",
      marginBottom: "16px",
      borderRadius: "8px",
      background: b.bg,
      border: `1px solid ${b.border}`,
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flex: 1 }}>
        <span style={{ color: b.iconColor, fontSize: "14px", marginTop: "1px", flexShrink: 0 }}>
          {b.icon}
        </span>
        <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-dim)", lineHeight: 1.6, margin: 0 }}>
          {b.message}
        </p>
      </div>
      {b.action && b.actionFn && (
        <button
          onClick={b.actionFn}
          className="action-secondary"
          style={{ padding: "6px 14px", fontSize: "var(--text-caption)", borderRadius: "6px", flexShrink: 0 }}
        >
          {b.action} →
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION: MATCH OVERVIEW — now status-aware. "Offered" and
// "Rejected" previously routed here with different button labels
// but identical content. Each now gets a distinct contextual block
// built from the same underlying data, framed for what's actually
// useful at that stage.
// ════════════════════════════════════════════════════════════════
function MatchOverview({ app }) {
  const { analysis, status } = app;

  return (
    <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="panel" style={{ display: "flex", alignItems: "center", gap: "28px" }}>
        <div style={{
          fontFamily: "var(--font-data)", fontSize: "56px", fontWeight: 500,
          color: scoreColor(analysis.matchScore), lineHeight: 1,
        }}>
          {analysis.matchScore}
        </div>
        <div>
          <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-faint)", marginBottom: "4px" }}>
            Overall Match — {analysis.matchLabel}
          </p>
          <p style={{ fontSize: "var(--text-body)", color: "var(--ink-dim)", lineHeight: 1.65, maxWidth: "520px" }}>
            {analysis.summary}
          </p>
        </div>
      </div>

      {/* ── Offered: reframe strengths as negotiation leverage ── */}
      {status === "offered" && (
        <div className="panel" style={{ borderColor: "rgba(52, 211, 153, 0.25)", background: "rgba(52, 211, 153, 0.04)" }}>
          <span className="panel-label" style={{ color: "var(--emerald)" }}>Negotiation Leverage</span>
          <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-faint)", marginBottom: "14px", lineHeight: 1.6 }}>
            You scored {analysis.matchScore}/100 on this role — these are the strengths
            that earned the offer. Worth restating when discussing compensation or start terms.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {analysis.strengths?.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: "var(--emerald)", fontSize: "13px" }}>★</span>
                <span style={{ fontSize: "var(--text-body)", color: "var(--ink-dim)", lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Rejected: reframe missing keywords as next-time action items ── */}
      {status === "rejected" && (
        <div className="panel" style={{ borderColor: "rgba(245, 158, 11, 0.2)", background: "rgba(245, 158, 11, 0.03)" }}>
          <span className="panel-label" style={{ color: "var(--amber)" }}>Lessons for Next Time</span>
          <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-faint)", marginBottom: "14px", lineHeight: 1.6 }}>
            {analysis.missingKeywords?.length > 0
              ? `This role scored ${analysis.matchScore}/100. The gaps below were identified at the time — closing them strengthens your next application to a similar role.`
              : `This role scored ${analysis.matchScore}/100 with no major resume gaps identified — the rejection likely came down to factors outside the resume itself (timing, internal candidates, interview fit).`}
          </p>
          {analysis.missingKeywords?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {analysis.missingKeywords.map((kw, i) => (
                <span key={i} style={{
                  fontSize: "var(--text-caption)", color: "var(--amber)",
                  background: "var(--amber-dim)", padding: "4px 10px",
                  borderRadius: "100px", fontFamily: "var(--font-data)",
                }}>
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div className="panel">
          <span className="panel-label">What's Working</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {analysis.strengths?.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: "var(--emerald)", fontSize: "13px" }}>✓</span>
                <span style={{ fontSize: "var(--text-body)", color: "var(--ink-dim)", lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <span className="panel-label">What's Missing</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {analysis.missingKeywords?.map((kw, i) => (
              <span key={i} style={{
                fontSize: "var(--text-caption)", color: "var(--amber)",
                background: "var(--amber-dim)", padding: "4px 10px",
                borderRadius: "100px", fontFamily: "var(--font-data)",
              }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION: RESUME & COVER
// ════════════════════════════════════════════════════════════════
function DocumentsSection({ app, onContentSaved }) {
  const { analysis } = app;
  const [editingBullets, setEditingBullets] = useState(false);
  const [editingLetter, setEditingLetter] = useState(false);
  const [bulletsDraft, setBulletsDraft] = useState(analysis.tailoredBullets || []);
  const [letterDraft, setLetterDraft] = useState(analysis.coverLetter || "");
  const [savingBullets, setSavingBullets] = useState(false);
  const [savingLetter, setSavingLetter] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (!editingBullets) setBulletsDraft(analysis.tailoredBullets || []);
  }, [analysis.tailoredBullets]);

  useEffect(() => {
    if (!editingLetter) setLetterDraft(analysis.coverLetter || "");
  }, [analysis.coverLetter]);

  const saveBullets = async () => {
    setSavingBullets(true);
    setSaveError(null);
    try {
      const res = await updateApplicationContent(app._id, { tailoredBullets: bulletsDraft });
      onContentSaved(res.data);
      setEditingBullets(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSavingBullets(false);
    }
  };

  const saveLetter = async () => {
    setSavingLetter(true);
    setSaveError(null);
    try {
      const res = await updateApplicationContent(app._id, { coverLetter: letterDraft });
      onContentSaved(res.data);
      setEditingLetter(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSavingLetter(false);
    }
  };

  return (
    <div className="reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

      {/* ── Tailored Bullets ── */}
      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span className="panel-label" style={{ marginBottom: 0 }}>Tailored Resume Bullets</span>
          <div style={{ display: "flex", gap: "6px" }}>
            {!editingBullets && <CopyBtn text={analysis.tailoredBullets?.join("\n")} />}
            {editingBullets ? (
              <>
                <button onClick={saveBullets} disabled={savingBullets} className="action-primary"
                  style={{ padding: "5px 12px", fontSize: "var(--text-micro)", borderRadius: "6px" }}>
                  {savingBullets ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setEditingBullets(false)} className="action-secondary"
                  style={{ padding: "5px 12px", fontSize: "var(--text-micro)", borderRadius: "6px" }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => { setBulletsDraft(analysis.tailoredBullets || []); setEditingBullets(true); }}
                className="action-secondary"
                style={{ padding: "5px 12px", fontSize: "var(--text-micro)", borderRadius: "6px" }}>
                Edit
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(editingBullets ? bulletsDraft : analysis.tailoredBullets)?.map((bullet, i) => (
            <div key={i} style={{
              display: "flex", gap: "10px", padding: "12px 14px",
              background: "var(--surface-raised)", borderRadius: "8px", border: "1px solid var(--line)",
            }}>
              <span style={{ fontFamily: "var(--font-data)", fontSize: "11px", color: "var(--teal)", marginTop: "2px" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {editingBullets ? (
                <textarea
                  value={bullet}
                  onChange={(e) => setBulletsDraft((prev) => prev.map((b, idx) => idx === i ? e.target.value : b))}
                  rows={2}
                  className="field"
                  style={{ resize: "none", fontSize: "var(--text-body)", lineHeight: 1.55, padding: "0", background: "transparent", border: "none" }}
                />
              ) : (
                <p style={{ fontSize: "var(--text-body)", color: "var(--ink-dim)", lineHeight: 1.55 }}>{bullet}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Cover Letter ── */}
      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span className="panel-label" style={{ marginBottom: 0 }}>Cover Letter</span>
          <div style={{ display: "flex", gap: "6px" }}>
            {!editingLetter && <CopyBtn text={analysis.coverLetter} />}
            {editingLetter ? (
              <>
                <button onClick={saveLetter} disabled={savingLetter} className="action-primary"
                  style={{ padding: "5px 12px", fontSize: "var(--text-micro)", borderRadius: "6px" }}>
                  {savingLetter ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setEditingLetter(false)} className="action-secondary"
                  style={{ padding: "5px 12px", fontSize: "var(--text-micro)", borderRadius: "6px" }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => { setLetterDraft(analysis.coverLetter || ""); setEditingLetter(true); }}
                className="action-secondary"
                style={{ padding: "5px 12px", fontSize: "var(--text-micro)", borderRadius: "6px" }}>
                Edit
              </button>
            )}
          </div>
        </div>
        {editingLetter ? (
          <textarea
            value={letterDraft}
            onChange={(e) => setLetterDraft(e.target.value)}
            rows={16}
            className="field"
            style={{ resize: "none", lineHeight: 1.8, fontFamily: "var(--font-body)" }}
          />
        ) : (
          <p style={{ fontSize: "var(--text-body)", color: "var(--ink-dim)", lineHeight: 1.8, whiteSpace: "pre-line" }}>
            {analysis.coverLetter}
          </p>
        )}
      </div>

      {saveError && (
        <p style={{ fontSize: "var(--text-caption)", color: "var(--red)", gridColumn: "1 / -1" }}>
          ⚠ {saveError}
        </p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION: COMPANY INTEL
// ════════════════════════════════════════════════════════════════
function IntelSection({ app, onResearch, researching, researchError }) {
  const hasResearch = app.research?.companyOverview?.length > 0;

  if (!hasResearch) {
    return (
      <div className="reveal panel" style={{ textAlign: "center", padding: "48px 32px" }}>
        <span className="panel-label" style={{ textAlign: "left" }}>Company Intel</span>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "19px", fontWeight: 500, color: "var(--ink)", marginBottom: "10px" }}>
          No briefing on file for {app.company} yet.
        </p>
        <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-faint)", maxWidth: "380px", margin: "0 auto 24px" }}>
          The research agent will search the web for recent news, culture signals,
          and likely interview questions specific to this role.
        </p>
        {researchError && (
          <p style={{ fontSize: "var(--text-caption)", color: "var(--red)", maxWidth: "380px", margin: "0 auto 16px" }}>
            ⚠ {researchError}
          </p>
        )}
        <button onClick={onResearch} disabled={researching} className="action-primary"
          style={{ padding: "11px 24px", borderRadius: "8px" }}>
          {researching ? "Agent researching..." : researchError ? "Try again →" : "Run Company Research →"}
        </button>
      </div>
    );
  }

  return (
    <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div className="panel">
          <span className="panel-label">Company Overview</span>
          <p style={{ fontSize: "var(--text-body)", color: "var(--ink-dim)", lineHeight: 1.7 }}>{app.research.companyOverview}</p>
        </div>
        <div className="panel">
          <span className="panel-label">Culture & Values</span>
          <p style={{ fontSize: "var(--text-body)", color: "var(--ink-dim)", lineHeight: 1.7 }}>{app.research.culture}</p>
        </div>
      </div>
      <div className="panel">
        <span className="panel-label">Recent News</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {app.research.recentNews?.map((news, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ color: "var(--amber)", fontSize: "12px", marginTop: "2px" }}>▸</span>
              <p style={{ fontSize: "var(--text-body)", color: "var(--ink-dim)", lineHeight: 1.6 }}>{news}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <span className="panel-label">Strategic Talking Points</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {app.research.talkingPoints?.map((point, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontFamily: "var(--font-data)", fontSize: "11px", color: "var(--teal)", marginTop: "2px" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <p style={{ fontSize: "var(--text-body)", color: "var(--ink-dim)", lineHeight: 1.6 }}>{point}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION: INTERVIEW READINESS
// ════════════════════════════════════════════════════════════════
function InterviewSection({ app, onResearch, researching, researchError }) {
  const hasResearch = app.research?.companyOverview?.length > 0;

  if (!hasResearch) {
    return (
      <div className="reveal panel" style={{ textAlign: "center", padding: "48px 32px" }}>
        <span className="panel-label" style={{ textAlign: "left" }}>Interview Readiness</span>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "19px", fontWeight: 500, color: "var(--ink)", marginBottom: "10px" }}>
          Readiness depends on company intel.
        </p>
        <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-faint)", maxWidth: "380px", margin: "0 auto 24px" }}>
          Run company research first — likely questions are generated from what
          the agent finds about {app.company}.
        </p>
        {researchError && (
          <p style={{ fontSize: "var(--text-caption)", color: "var(--red)", maxWidth: "380px", margin: "0 auto 16px" }}>
            ⚠ {researchError}
          </p>
        )}
        <button onClick={onResearch} disabled={researching} className="action-primary"
          style={{ padding: "11px 24px", borderRadius: "8px" }}>
          {researching ? "Agent researching..." : researchError ? "Try again →" : "Run Company Research →"}
        </button>
      </div>
    );
  }

  const readiness = Math.min(40 + (app.research.interviewQuestions?.length || 0) * 12, 100);

  return (
    <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="panel" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ fontFamily: "var(--font-data)", fontSize: "36px", fontWeight: 500, color: scoreColor(readiness) }}>
          {readiness}%
        </div>
        <div>
          <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-faint)" }}>Readiness Score</p>
          <p style={{ fontSize: "var(--text-body)", color: "var(--ink-dim)" }}>
            Based on briefing depth and questions prepared
          </p>
        </div>
      </div>
      <div className="panel">
        <span className="panel-label">Likely Interview Questions</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {app.research.interviewQuestions?.map((item, i) => (
            <div key={i} style={{
              padding: "14px 16px", background: "var(--surface-raised)",
              border: "1px solid var(--line)", borderRadius: "8px",
            }}>
              <p style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--ink)", marginBottom: "6px" }}>
                Q{i + 1}. {item.question}
              </p>
              <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-faint)", lineHeight: 1.55 }}>
                💬 {item.tip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN — APPLICATION DOSSIER
// ════════════════════════════════════════════════════════════════
function ApplicationDossier() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusSaved, setStatusSaved] = useState(false);

  useEffect(() => {
    if (!id || id === "undefined") {
      setError("No application id was provided.");
      setLoading(false);
      return;
    }
    getApplicationById(id)
      .then((res) => setApp(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const section = SECTIONS.find((s) => s.shortcut === e.key);
      if (section) {
        e.preventDefault();
        setActiveSection(section.key);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleResearch = async () => {
    setResearching(true);
    setResearchError(null);
    try {
      const res = await researchApplication(id);
      setApp(res.data);
      setActiveSection("intel");
    } catch (err) {
      setResearchError(err.message);
    } finally {
      setResearching(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusSaving(true);
    try {
      const res = await updateApplicationStatus(id, newStatus);
      setApp(res.data);
      setStatusSaved(true);
      setTimeout(() => setStatusSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setStatusSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 56px)" }}>
        <span style={{ fontFamily: "var(--font-data)", fontSize: "var(--text-caption)", color: "var(--ink-faint)" }}>
          Retrieving dossier...
        </span>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 56px)", gap: "12px" }}>
        <p style={{ color: "var(--red)", fontSize: "var(--text-body)" }}>⚠ {error || "Dossier not found."}</p>
        <Link to="/pipeline" className="action-secondary"
          style={{ padding: "8px 16px", borderRadius: "6px", textDecoration: "none" }}>
          ← Back to Pipeline
        </Link>
      </div>
    );
  }

  const statusMeta = STATUS_META[app.status];

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 24px 80px" }}>

      {/* ── Header strip ── */}
      <div className="panel" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "16px", flexWrap: "wrap", gap: "16px",
      }}>
        <div>
          <p style={{
            fontSize: "var(--text-micro)", color: "var(--ink-faint)",
            fontFamily: "var(--font-data)", letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: "4px",
          }}>
            Dossier
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 600, color: "var(--ink)" }}>
            {app.jobTitle}
          </h1>
          <p style={{ fontSize: "var(--text-body)", color: "var(--ink-faint)", marginTop: "2px" }}>
            {app.company}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            fontFamily: "var(--font-data)", fontSize: "28px", fontWeight: 500,
            color: scoreColor(app.analysis?.matchScore),
          }}>
            {app.analysis?.matchScore}
          </div>

          <select
            value={app.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={statusSaving}
            className="field"
            style={{
              width: "auto", padding: "8px 12px",
              cursor: statusSaving ? "wait" : "pointer",
              color: statusMeta.color, fontSize: "var(--text-caption)",
              opacity: statusSaving ? 0.6 : 1,
              transition: "opacity 200ms ease",
            }}
          >
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key} style={{ background: "var(--surface)" }}>
                {meta.label}
              </option>
            ))}
          </select>

          {statusSaved && (
            <span style={{ fontSize: "var(--text-micro)", color: "var(--emerald)", fontFamily: "var(--font-data)" }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>

      {/* ── Status context banner ── */}
      <StatusBanner app={app} onSectionChange={setActiveSection} />

      {/* ── Section switcher ── */}
      <div style={{
        display: "flex", gap: "4px", marginBottom: "20px",
        background: "var(--surface)", border: "1px solid var(--line)",
        borderRadius: "10px", padding: "4px",
      }}>
        {SECTIONS.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            style={{
              flex: 1, padding: "9px 12px", border: "none", borderRadius: "7px",
              fontSize: "var(--text-caption)", fontWeight: 500, cursor: "pointer",
              fontFamily: "var(--font-body)",
              background: activeSection === section.key ? "var(--surface-raised)" : "transparent",
              color: activeSection === section.key ? "var(--ink)" : "var(--ink-faint)",
              transition: "all var(--duration-transition) var(--ease-standard)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}
          >
            {section.label}
            <span style={{ fontFamily: "var(--font-data)", fontSize: "10px", opacity: 0.5 }}>
              ⌘{section.shortcut}
            </span>
          </button>
        ))}
      </div>

      {/* ── Active section ── */}
      <div key={activeSection}>
        {activeSection === "overview"  && <MatchOverview app={app} />}
        {activeSection === "documents" && <DocumentsSection app={app} onContentSaved={setApp} />}
        {activeSection === "intel"     && <IntelSection app={app} onResearch={handleResearch} researching={researching} researchError={researchError} />}
        {activeSection === "interview" && <InterviewSection app={app} onResearch={handleResearch} researching={researching} researchError={researchError} />}
      </div>
    </div>
  );
}

export default ApplicationDossier;
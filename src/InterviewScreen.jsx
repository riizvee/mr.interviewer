import { useEffect, useMemo, useRef, useState } from "react";

function ScoreStamp({ score, verdict }) {
  const tone = score >= 7 ? "good" : score >= 4 ? "warn" : "bad";
  return (
    <div className={`score-stamp ${tone}`}>
      <span className="score-number">{score}</span>
      <span className="score-max">/10</span>
      <span className="score-verdict">{verdict}</span>
    </div>
  );
}

function scoreTone(score) {
  if (score >= 7) return "good";
  if (score >= 4) return "warn";
  return "bad";
}

export default function InterviewScreen({
  meta,
  messages,
  onSubmitAnswer,
  onEndInterview,
  onRestart,
  submitting,
  done,
  report,
}) {
  const [draft, setDraft] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return 120;
    return 300;
  });
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const DEFAULT_TEXTAREA_HEIGHT = typeof window !== "undefined" && window.innerWidth < 768 ? 120 : 300;
  const MAX_TEXTAREA_HEIGHT = typeof window !== "undefined" && window.innerWidth < 768 ? 280 : 500;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, DEFAULT_TEXTAREA_HEIGHT), MAX_TEXTAREA_HEIGHT);

    setTextareaHeight((currentHeight) => (nextHeight > currentHeight ? nextHeight : currentHeight));
  }, [draft, DEFAULT_TEXTAREA_HEIGHT, MAX_TEXTAREA_HEIGHT]);

  const scoredMessages = useMemo(
    () => messages.filter((m) => typeof m.score === "number"),
    [messages]
  );

  const avgScore = useMemo(() => {
    if (scoredMessages.length === 0) return null;
    const sum = scoredMessages.reduce((a, m) => a + m.score, 0);
    return (sum / scoredMessages.length).toFixed(1);
  }, [scoredMessages]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!draft.trim() || submitting || done) return;
    onSubmitAnswer(draft.trim());
    setDraft("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleResizeStart(e) {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = textareaHeight;

    function onMove(moveEvent) {
      const deltaY = moveEvent.clientY - startY;
      const nextHeight = Math.max(120, Math.min(500, startHeight + deltaY));
      setTextareaHeight(nextHeight);
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const currentQ = Math.min(meta.questionNumber, meta.totalQuestions);
  const progressPct = (currentQ / meta.totalQuestions) * 100;

  return (
    <div className={`interview-screen ${sidebarOpen ? "sidebar-open" : ""}`}>
      <button className="mobile-sidebar-toggle" onClick={() => setSidebarOpen((open) => !open)}>
        Interview menu
      </button>

      <aside className={`sidebar ${sidebarOpen ? "visible" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <span className="brand-dot" />
            MR. INTERVIEWER
          </div>
          <button className="sidebar-close" type="button" onClick={() => setSidebarOpen(false)}>
            ×
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Topic</div>
          <div className="sidebar-value sidebar-topic">{meta.topic}</div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Type</div>
          <div className="sidebar-value">{meta.interviewType}</div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Level</div>
          <div className={`level-badge level-${meta.difficulty}`}>{meta.difficulty}</div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Progress</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="sidebar-value progress-text">
            Question <strong>{currentQ}</strong> / {meta.totalQuestions}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Avg. score</div>
          <div className="sidebar-score">
            {avgScore !== null ? (
              <>
                <span className="sidebar-score-num">{avgScore}</span>
                <span className="sidebar-score-max">/10</span>
              </>
            ) : (
              <span className="sidebar-score-empty">—</span>
            )}
          </div>
        </div>

        <div className="sidebar-section sidebar-scorelist-section">
          <div className="sidebar-label">Question scores</div>
          {scoredMessages.length === 0 ? (
            <div className="scorelist-empty">No answers scored yet</div>
          ) : (
            <ul className="scorelist">
              {scoredMessages.map((m, i) => {
                const tone = scoreTone(m.score);
                return (
                  <li key={i} className="scorelist-item">
                    <span className="scorelist-qnum">Q{i + 1}</span>
                    <span className="scorelist-bar-track">
                      <span
                        className={`scorelist-bar-fill ${tone}`}
                        style={{ width: `${(m.score / 10) * 100}%` }}
                      />
                    </span>
                    <span className={`scorelist-num ${tone}`}>{m.score}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ---------- FINAL REPORT (inline, appears when done) ---------- */}
        {done && report && (
          <div className="sidebar-section sidebar-report-section">
            <div className="sidebar-label">Final report</div>

            <div className={`report-overall ${scoreTone(report.overall_score)}`}>
              <span className="report-overall-num">{report.overall_score}</span>
              <span className="report-overall-max">/10</span>
            </div>

            <p className="report-summary-mini">{report.summary}</p>

            {report.strengths?.length > 0 && (
              <div className="report-mini-block">
                <div className="report-mini-heading">Strengths</div>
                <ul className="report-mini-list">
                  {report.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.areas_to_improve?.length > 0 && (
              <div className="report-mini-block">
                <div className="report-mini-heading">Areas to improve</div>
                <ul className="report-mini-list">
                  {report.areas_to_improve.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.recommendation && (
              <div className="report-recommendation-mini">
                <span className="hint-label">Recommendation:</span> {report.recommendation}
              </div>
            )}
          </div>
        )}

        <div className="sidebar-spacer" />

        {!done ? (
          <button className="end-btn" onClick={onEndInterview} disabled={done}>
            End interview
          </button>
        ) : (
          <button className="restart-btn" onClick={onRestart}>
            Start new interview
          </button>
        )}
      </aside>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* ---------- RIGHT PANEL: CHAT ---------- */}
      <main className="chat-panel">
        <div className="chat-actions">
          <button className="mobile-sidebar-toggle" onClick={() => setSidebarOpen((open) => !open)}>
            Interview menu
          </button>
        </div>
        <div className="transcript" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`bubble-row ${m.role}`}>
              {m.role === "interviewer" && <div className="avatar">MI</div>}
              <div className="bubble">
                <div className="bubble-content">{m.content}</div>
                {m.score !== undefined && (
                  <>
                    <ScoreStamp score={m.score} verdict={m.verdict} />
                    <div className="feedback-text">{m.feedback}</div>
                    {m.model_answer && m.score < 8 && (
  <div className="model-answer">
    <div className="model-answer-label">✦ Ideal answer</div>
    <div className="model-answer-text">{m.model_answer}</div>
  </div>
)}
                  </>
                )}
              </div>
            </div>
          ))}
          {submitting && (
            <div className="bubble-row interviewer">
              <div className="avatar">MI</div>
              <div className="bubble thinking">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
        </div>

        {!done ? (
          <form className="answer-form" onSubmit={handleSubmit}>
            <div className="textarea-shell">
              <div className="textarea-resizer" onMouseDown={handleResizeStart} />
              <textarea
                ref={textareaRef}
                placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={submitting}
                rows={3}
                style={{ height: `${textareaHeight}px` }}
              />
            </div>
            <button type="submit" className="primary-btn" disabled={submitting || !draft.trim()}>
              Send
            </button>
          </form>
        ) : (
          <div className="done-banner">Interview complete — see your report in the sidebar.</div>
        )}
      </main>
    </div>
  );
}
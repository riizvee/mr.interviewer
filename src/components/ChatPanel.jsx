import { useEffect, useRef, useState } from "react";

function ScoreCard({ scoring }) {
  if (!scoring) return null;
  const good = (scoring.score ?? 0) >= 6;
  return (
    <div className="score-card">
      <div className="score-row">
        {scoring.score !== null && (
          <span className={`score-chip ${good ? "good" : "needs-work"}`}>{scoring.score}/10</span>
        )}
        <span className="score-verdict">{scoring.verdict}</span>
      </div>
      <p className="score-feedback">{scoring.feedback}</p>
      {scoring.model_answer_hint && (
        <p className="score-hint">💡 Better answer + memory trick: {scoring.model_answer_hint}</p>
      )}
    </div>
  );
}

function ReportCard({ report }) {
  if (!report) return null;
  return (
    <div className="report-card">
      <div className="report-score">{report.overall_score ?? "—"}</div>
      <div className="report-score-label">OVERALL SCORE / 100</div>
      <p className="report-summary">{report.summary}</p>
      <div className="report-columns">
        <div className="report-col">
          <h4>Strengths</h4>
          <ul>
            {(report.strengths || []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="report-col">
          <h4>Areas to improve</h4>
          <ul>
            {(report.areas_to_improve || []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
      {report.recommendation && (
        <div className="report-recommendation">{report.recommendation}</div>
      )}
    </div>
  );
}

export default function ChatPanel({ setup, status, messages, loading, onSubmitAnswer, questionIndex, numQuestions }) {
  const [answer, setAnswer] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = () => {
    if (!answer.trim() || loading) return;
    onSubmitAnswer(answer.trim());
    setAnswer("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="main">
      <div className="chat-header">
      {/*   <h2>{status === "idle" ? "Mr. Interviewer" : setup.subject}</h2> */}
        {status !== "idle" && (
          <span className="progress-label">
            {status === "finished" ? "Complete" : `Question ${questionIndex + 1} / ${numQuestions}`}
          </span>
        )}
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        {status === "idle" && (
          <div className="empty-state">
            <h3>Ready when you are</h3>
            <p>Pick an interview type, subject, and difficulty on the left, then start the interview.</p>
          </div>
        )}

        {messages.map((m, i) => {
          if (m.type === "question") {
            return (
              <div className="bubble bubble-question" key={i}>
                <div className="bubble-label">Question {m.questionNumber}</div>
                <div className="bubble-text">{m.content}</div>
              </div>
            );
          }
          if (m.type === "answer") {
            return (
              <div className="bubble bubble-answer" key={i}>
                <div className="bubble-label">Your answer</div>
                <div className="bubble-text">{m.content}</div>
              </div>
            );
          }
          if (m.type === "score") {
            return <ScoreCard scoring={m.content} key={i} />;
          }
          if (m.type === "report") {
            return <ReportCard report={m.content} key={i} />;
          }
          return null;
        })}

        {loading && <div className="thinking">Mr. Interviewer is thinking…</div>}
      </div>

      {status === "in_progress" && (
        <div className="composer">
          <textarea
            placeholder="Type your answer… (Enter to send, Shift+Enter for a new line)"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button className="btn-primary" onClick={handleSubmit} disabled={loading || !answer.trim()}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}

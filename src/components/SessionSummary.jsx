export default function SessionSummary({ setup, questionIndex, numQuestions, status, onRestart, onEnd }) {
  return (
    <div className="session-summary">
      <div className="session-meta">
     {   <div className="session-meta-row">
          <span>Type</span>
          <span>{setup.interviewType}</span>
        </div>}
      {/*   <div className="session-meta-row">
          <span>Subject</span>
          <span>{setup.subject}</span>
        </div> */}
        <div className="session-meta-row">
          <span>Difficulty</span>
          <span>{setup.difficulty}</span>
        </div>
      </div>

      <div className="docket">
        {Array.from({ length: numQuestions }).map((_, i) => {
          const state = i < questionIndex || status === "finished" ? "done" : i === questionIndex ? "current" : "";
          return (
            <div key={i} className={`docket-item ${state}`}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <span className="dot" />
              <span>Question {i + 1}</span>
            </div>
          );
        })}
      </div>

      <div className="sidebar-actions">
        <button className="btn-secondary" onClick={onRestart}>
          New interview
        </button>
        {status !== "finished" && (
          <button className="btn-secondary" onClick={onEnd}>
            End interview now
          </button>
        )}
      </div>
    </div>
  );
}

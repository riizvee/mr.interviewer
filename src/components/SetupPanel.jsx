const INTERVIEW_TYPES = [
 { value: "exam", label: "Subject exam" },
  { value: "coding", label: "Coding interview" },
  { value: "hr", label: "HR / general interview" },
  { value: "behavioral", label: "Behavioral interview" },
 
];

const DIFFICULTIES = ["easy", "medium", "hard"];

export default function SetupPanel({ setup, onChange, onStart, loading, error }) {
  const update = (key, value) => onChange({ ...setup, [key]: value });

  return (
    <div className="setup-panel">
      <div className="field">
        <label htmlFor="interviewType">Interview type</label>
        <select
          id="interviewType"
          value={setup.interviewType}
          onChange={(e) => update("interviewType", e.target.value)}
        >
          {INTERVIEW_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="subject">Subject / role</label>
        <input
          id="subject"
          type="text"
          placeholder="e.g. React.js, Marketing Manager, Organic Chemistry"
          value={setup.subject}
          onChange={(e) => update("subject", e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="difficulty">Difficulty</label>
        <select
          id="difficulty"
          value={setup.difficulty}
          onChange={(e) => update("difficulty", e.target.value)}
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d[0].toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="numQuestions">Number of questions</label>
        <input
          id="numQuestions"
          type="number"
          min={1}
          max={20}
          value={setup.numQuestions}
          onChange={(e) => update("numQuestions", e.target.value)}
        />
        <span className="field-hint">Between 1 and 20.</span>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <button
        className="btn-primary"
        onClick={onStart}
        disabled={loading || !setup.subject.trim()}
      >
        {loading ? "Starting…" : "Start interview"}
      </button>
    </div>
  );
}

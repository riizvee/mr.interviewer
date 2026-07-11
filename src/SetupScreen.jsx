import { useState } from "react";

const TYPES = [
   { id: "exam", label: "Exam / Subject", hint: "e.g. Organic Chemistry, World History" },
  { id: "coding", label: "Coding", hint: "e.g. React.js, Python, Data Structures" },
  { id: "hr", label: "General / HR", hint: "e.g. Marketing Manager, Sales Rep" },
  { id: "behavioral", label: "Behavioral", hint: "e.g. Team Lead, Customer Support" },
 
];

const DIFFICULTIES = ["easy", "medium", "hard"];

export default function SetupScreen({ onStart, starting, error }) {
  const [interviewType, setInterviewType] = useState("exam");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);

  const activeType = TYPES.find((t) => t.id === interviewType);

  function handleSubmit(e) {
    e.preventDefault();
    if (!topic.trim()) return;
    onStart({ interviewType, topic: topic.trim(), difficulty, numQuestions });
  }

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-eyebrow">MR. INTERVIEWER</div>
        <h1 className="setup-title">Let's set the room.</h1>
        <p className="setup-subtitle">
          Tell me what kind of interview you want, and I'll take it from there.
        </p>

        <form onSubmit={handleSubmit}>
          <fieldset className="field-group">
            <legend>Interview type</legend>
            <div className="type-grid">
              {TYPES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={`type-pill ${interviewType === t.id ? "active" : ""}`}
                  onClick={() => setInterviewType(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="field-group">
            <label htmlFor="topic">Topic / Role / Subject</label>
            <input
              id="topic"
              type="text"
              placeholder={activeType.hint}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              autoFocus
            />
          </fieldset>

          <div className="field-row">
            <fieldset className="field-group">
              <legend>Difficulty</legend>
              <div className="type-grid">
                {DIFFICULTIES.map((d) => (
                  <button
                    type="button"
                    key={d}
                    className={`type-pill small ${difficulty === d ? "active" : ""}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="field-group">
              <label htmlFor="numQuestions">Questions</label>
              <input
                id="numQuestions"
                type="number"
                min={3}
                max={15}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
              />
            </fieldset>
          </div>

          {error && <div className="setup-error">{error}</div>}

          <button type="submit" className="startbtn" disabled={starting || !topic.trim()}>
            {starting ? "Walking in…" : "Start the interview"}
          </button>
        </form>
      </div>
    </div>
  );
}

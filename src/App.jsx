import { useEffect, useState } from "react";
import SetupPanel from "./components/SetupPanel.jsx";
import SessionSummary from "./components/SessionSummary.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import InterviewScreen from "./InterviewScreen.jsx";
import { startInterview, submitAnswer, endInterview } from "./api.js";

const STORAGE_KEY = "mr-interviewer-state";

const DEFAULT_SETUP = {
  interviewType: "exam",
  subject: "",
  difficulty: "medium",
  numQuestions: 5,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function freshState() {
  return {
    setup: DEFAULT_SETUP,
    status: "idle", // idle | in_progress | finished
    sessionId: null,
    messages: [],
    questionIndex: 0,
    numQuestions: DEFAULT_SETUP.numQuestions,
  };
}

function toInterviewMessages(messages) {
  return messages.map((m) => {
    if (m.type === "question") {
      return {
        role: "interviewer",
        content: m.content,
        questionNumber: m.questionNumber,
      };
    }

    if (m.type === "answer") {
      return {
        role: "candidate",
        content: m.content,
      };
    }

    if (m.type === "score") {
      return {
        role: "interviewer",
        content: m.content?.verdict || "Score received",
        score: m.content?.score,
        verdict: m.content?.verdict,
        feedback: m.content?.feedback,
        model_answer: m.content?.model_answer_hint,
      };
    }

    if (m.type === "report") {
      return {
        role: "interviewer",
        content: m.content?.summary || "Interview complete.",
      };
    }

    return { role: "interviewer", content: "" };
  });
}

export default function App() {
  const [state, setState] = useState(() => loadState() || freshState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Persist on every change so a refresh (or accidental tab close) keeps the
  // chat exactly as it was, until the user restarts or ends the interview.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateSetup = (setup) => setState((s) => ({ ...s, setup }));

  const handleStart = async () => {
    setError("");
    setSidebarOpen(false);
    setLoading(true);
    try {
      const numQuestions = Math.max(1, Math.min(20, Number(state.setup.numQuestions) || 5));
      const res = await startInterview({ ...state.setup, numQuestions });
      setState((s) => ({
        ...s,
        setup: { ...s.setup, numQuestions },
        status: "in_progress",
        sessionId: res.sessionId,
        questionIndex: res.questionIndex,
        numQuestions: res.numQuestions,
        messages: [{ type: "question", content: res.question, questionNumber: 1 }],
      }));
    } catch (e) {
      setError(e.message || "Failed to start interview.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer) => {
    setError("");
    setLoading(true);
    setState((s) => ({ ...s, messages: [...s.messages, { type: "answer", content: answer }] }));
    try {
      const res = await submitAnswer(state.sessionId, answer);
      setState((s) => {
        const messages = [...s.messages, { type: "score", content: res.scoring }];
        if (res.done) {
          messages.push({ type: "report", content: res.report });
          return { ...s, status: "finished", messages };
        }
        messages.push({
          type: "question",
          content: res.question,
          questionNumber: res.questionIndex + 1,
        });
        return { ...s, questionIndex: res.questionIndex, messages };
      });
    } catch (e) {
      setError(e.message || "Failed to submit answer.");
    } finally {
      setLoading(false);
    }
  };

  const handleEndNow = async () => {
    if (state.sessionId) {
      try {
        await endInterview(state.sessionId);
      } catch {
        // ignore — we're ending locally regardless
      }
    }
    setState((s) => ({
      ...s,
      status: "finished",
      messages: [...s.messages, { type: "score", content: { score: null, verdict: "Interview ended early", feedback: "You ended this interview before all questions were answered. Start a new one anytime.", model_answer_hint: "" } }],
    }));
  };

  const handleRestart = async () => {
    if (state.sessionId && state.status !== "finished") {
      try {
        await endInterview(state.sessionId);
      } catch {
        // ignore
      }
    }
    setError("");
    setState(freshState());
  };

  const interviewMeta = {
    topic: state.setup.subject || "General Interview",
    interviewType: state.setup.interviewType,
    difficulty: state.setup.difficulty,
    questionNumber: Math.min(Math.max(state.questionIndex + 1, 1), state.numQuestions || 1),
    totalQuestions: state.numQuestions || 1,
  };

  const interviewMessages = toInterviewMessages(state.messages);
  const report = state.messages.find((m) => m.type === "report")?.content ?? null;

  if (state.status !== "idle") {
    return (
      <InterviewScreen
        meta={interviewMeta}
        messages={interviewMessages}
        onSubmitAnswer={handleSubmitAnswer}
        onEndInterview={handleEndNow}
        onRestart={handleRestart}
        submitting={loading}
        done={state.status === "finished"}
        report={report}
      />
    );
  }

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <button className="mobile-sidebar-toggle" onClick={() => setSidebarOpen((open) => !open)}>
        Open setup
      </button>

      <aside className={`sidebar ${sidebarOpen ? "visible" : ""}`}>
        <div className="sidebar-top">
          <div className="brand">
            <p className="brand-eyebrow">AI Interview Practice</p>
            <h1 className="brand-title">Mr. Interviewer 🎤</h1>
          </div>
          <button className="sidebar-close" type="button" onClick={() => setSidebarOpen(false)}>
            ×
          </button>
        </div>

        <SetupPanel setup={state.setup} onChange={updateSetup} onStart={handleStart} loading={loading} error={error} />
      </aside>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <ChatPanel
        setup={state.setup}
        status={state.status}
        messages={state.messages}
        loading={loading}
        onSubmitAnswer={handleSubmitAnswer}
        questionIndex={state.questionIndex}
        numQuestions={state.numQuestions}
      />
    </div>
  );
}

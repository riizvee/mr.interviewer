import "dotenv/config";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import {
  generateFirstQuestion,
  generateNextQuestion,
  scoreAnswer,
  generateReport,
} from "./interviewEngine.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Mr. Interviewer API is running");
});

// In-memory session store: sessionId -> session object.
// Fine for local/single-instance use. Swap for Redis/DB for production.
const sessions = new Map();

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/interview/start", async (req, res) => {
  try {
    const { interviewType, subject, difficulty, numQuestions } = req.body || {};

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: "Subject/topic/role is required." });
    }

    const clampedNumQuestions = Math.max(1, Math.min(20, Number(numQuestions) || 5));
    const safeType = interviewType || "exam";
    const safeDifficulty = difficulty || "medium";

    const question = await generateFirstQuestion({
      interviewType: safeType,
      subject: subject.trim(),
      difficulty: safeDifficulty,
    });

    const sessionId = uuidv4();
    sessions.set(sessionId, {
      id: sessionId,
      interviewType: safeType,
      subject: subject.trim(),
      difficulty: safeDifficulty,
      numQuestions: clampedNumQuestions,
      history: [], // [{question, answer, score, verdict, feedback, model_answer_hint}]
      questionIndex: 0, // 0-based index of the question currently being asked
      currentQuestion: question,
      status: "in_progress",
      createdAt: Date.now(),
    });

    res.json({
      sessionId,
      question,
      questionIndex: 0,
      numQuestions: clampedNumQuestions,
    });
  } catch (err) {
    console.error("start error:", err);
    res.status(500).json({ error: err.message || "Failed to start interview." });
  }
});

app.post("/api/interview/answer", async (req, res) => {
  try {
    const { sessionId, answer } = req.body || {};
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found. Please start a new interview." });
    }
    if (session.status !== "in_progress") {
      return res.status(400).json({ error: "This interview has already ended." });
    }
    if (!answer || !answer.trim()) {
      return res.status(400).json({ error: "Answer cannot be empty." });
    }

    const scoring = await scoreAnswer({
      interviewType: session.interviewType,
      subject: session.subject,
      difficulty: session.difficulty,
      question: session.currentQuestion,
      answer: answer.trim(),
      history: session.history,
    });

    session.history.push({
      question: session.currentQuestion,
      answer: answer.trim(),
      score: scoring.score,
      verdict: scoring.verdict,
      feedback: scoring.feedback,
      model_answer_hint: scoring.model_answer_hint || "",
    });

    const nextIndex = session.questionIndex + 1;

    // --- This is the loop that was missing/broken before: it keeps going
    // until numQuestions is actually reached, instead of stopping early. ---
    if (nextIndex >= session.numQuestions) {
      session.status = "finished";
      session.questionIndex = nextIndex;

      const report = await generateReport({
        interviewType: session.interviewType,
        subject: session.subject,
        difficulty: session.difficulty,
        history: session.history,
      });

      return res.json({
        scoring,
        done: true,
        report,
        questionIndex: nextIndex,
      });
    }

    const nextQuestion = await generateNextQuestion({
      interviewType: session.interviewType,
      subject: session.subject,
      difficulty: session.difficulty,
      history: session.history,
      nextQuestionNumber: nextIndex + 1,
      totalQuestions: session.numQuestions,
    });

    session.currentQuestion = nextQuestion;
    session.questionIndex = nextIndex;

    res.json({
      scoring,
      done: false,
      question: nextQuestion,
      questionIndex: nextIndex,
    });
  } catch (err) {
    console.error("answer error:", err);
    res.status(500).json({ error: err.message || "Failed to process answer." });
  }
});

app.post("/api/interview/end", (req, res) => {
  const { sessionId } = req.body || {};
  const session = sessions.get(sessionId);
  if (session) {
    session.status = "finished";
  }
  res.json({ ok: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Mr. Interviewer server running on http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn(
      "⚠️  GROQ_API_KEY is not set. Copy server/.env.example to server/.env and add your key."
    );
  }
});

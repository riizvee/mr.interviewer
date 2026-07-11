import { askAIForJSON } from "./aiClient.js";

const TYPE_LABELS = {
  exam: "a subject exam",
  coding: "a technical coding interview",
  hr: "a general HR / role-fit interview",
  behavioral: "a behavioral interview",
};

function typeLabel(interviewType) {
  return TYPE_LABELS[interviewType] || "an interview";
}

function historySummary(history) {
  if (history.length === 0) return "No questions have been asked yet.";
  return history
    .map(
      (h, i) =>
        `Q${i + 1}: ${h.question}\nCandidate's answer: ${h.answer}\nScore given: ${h.score}/10${
          h.model_answer_hint ? `\nMemory-trick hint given: ${h.model_answer_hint}` : ""
        }`
    )
    .join("\n\n");
}

/**
 * Generates the opening question for a fresh session.
 */
export async function generateFirstQuestion({ interviewType, subject, difficulty }) {
  const result = await askAIForJSON({
    system: `You are "Mr. Interviewer", a sharp, encouraging interviewer running ${typeLabel(
      interviewType
    )}. You ask one focused, specific question at a time — never generic or vague. Keep questions concise (1-3 sentences).`,
    user: `Topic/subject/role: "${subject}"
Difficulty: ${difficulty}

Write the FIRST interview question. It should be concrete and answerable in a few sentences to a couple paragraphs (not a yes/no question).

Respond as JSON: { "question": "..." }`,
    maxTokens: 300,
  });
  return result.question;
}

/**
 * Scores a candidate's answer to the current question.
 * If score < 8, includes a model_answer_hint containing a concise ideal
 * answer PLUS an explicit memory trick (mnemonic, acronym, vivid mental
 * image, or story hook) to help the candidate remember it next time.
 */
export async function scoreAnswer({ interviewType, subject, difficulty, question, answer, history }) {
  const result = await askAIForJSON({
    system: `You are "Mr. Interviewer", grading a candidate's answer during ${typeLabel(
      interviewType
    )} on "${subject}" at ${difficulty} difficulty. Be fair but rigorous. Give real, specific feedback — not generic praise.`,
    user: `Question asked: "${question}"
Candidate's answer: "${answer}"

Score the answer from 0 to 10 (integer).

Then:
- "verdict": a short 2-5 word tag, e.g. "Strong answer", "Partially correct", "Needs work", "Off track".
- "model_answer_hint": ONLY if score is less than 8. tell it's ok if you don't know everything properly then Give a concise ideal/model answer (2-4 sentences), AND attach a genuine memory trick to help them retain it — memory trick is like a real life non coding simple story as example "Memory trick: picture ... " If score is 8 or higher, set this to an empty string.

Respond as JSON:
{
  "score": <integer 0-10>,
 
  "model_answer_hint": "..."
}`,
    maxTokens: 700,
  });

  // Clamp/validate
  result.score = Math.max(0, Math.min(10, Math.round(Number(result.score) || 0)));
  if (result.score >= 8) result.model_answer_hint = "";
  return result;
}

/**
 * Generates the next question. This is the core "adaptive memory" loop:
 * - If the previous answer scored below 8, the next question circles back
 *   to reinforce the SAME weak concept (using the memory trick just given)
 *   before moving on, instead of just marching to a brand-new topic.
 * - If the previous answer scored 8+, it moves to a new, slightly harder
 *   angle on the subject.
 * It always has the full running history so it never repeats a question.
 */
export async function generateNextQuestion({
  interviewType,
  subject,
  difficulty,
  history,
  nextQuestionNumber,
  totalQuestions,
}) {
  const last = history[history.length - 1];
  const needsReinforcement = last.score < 8;

  const result = await askAIForJSON({
    system: `You are "Mr. Interviewer", running ${typeLabel(
      interviewType
    )} on "${subject}" at ${difficulty} difficulty. This is question ${nextQuestionNumber} of ${totalQuestions}. Never repeat a question already asked. Keep questions concise (1-3 sentences).`,
    user: `Interview so far:
${historySummary(history)}

${
  needsReinforcement
    ? `The candidate scored below 8 on the last question and received this memory-trick hint: "${last.model_answer_hint}"

Write the NEXT question so it circles back to test the SAME underlying concept from a different angle — giving them a chance to apply what the memory trick just taught them. Don't just repeat the old question verbatim; reframe it (different scenario/wording) so recall is genuinely tested.`
    : `The candidate scored well on the last question. Write the NEXT question that moves to a new angle or slightly harder aspect of "${subject}", building naturally on what's already been covered.`
}

Respond as JSON: { "question": "..." }`,
    maxTokens: 300,
  });
  return result.question;
}

/**
 * Generates the final wrap-up report once all questions are answered.
 */
export async function generateReport({ interviewType, subject, difficulty, history }) {
  const avgRaw = history.reduce((a, h) => a + h.score, 0) / history.length;
  const overall_score_10 = Math.round(avgRaw * 10) / 10;

  const result = await askAIForJSON({
    system: `You are "Mr. Interviewer" writing a closing performance report for ${typeLabel(
      interviewType
    )} on "${subject}" at ${difficulty} difficulty.`,
    user: `Full transcript:
${historySummary(history)}

Average score: ${overall_score_10}/10

Write a closing report:
- "summary": 2-3 sentence overall assessment.
- "strengths": array of 2-4 short bullet strings.
- "areas_to_improve": array of 2-4 short bullet strings.
- "recommendation": 1-2 sentence closing recommendation / next step.

Respond as JSON:
{
  "summary": "...",
  "strengths": ["...", "..."],
  "areas_to_improve": ["...", "..."],
  "recommendation": "..."
}`,
    maxTokens: 700,
  });

  return {
    overall_score: overall_score_10,
    summary: result.summary,
    strengths: result.strengths || [],
    areas_to_improve: result.areas_to_improve || [],
    recommendation: result.recommendation || "",
  };
}

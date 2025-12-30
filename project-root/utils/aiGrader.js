import OpenAI from "openai";

let client;

/**
 * Lazily initialize and return the OpenAI client.
 */
function getClient() {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY is missing. Check your .env file.");
      throw new Error("OPENAI_API_KEY not set");
    }
    console.log("✅ OpenAI client initialized with key:", apiKey.slice(0, 10) + "...");
    client = new OpenAI({ apiKey });
  }
  return client;
}

/**
 * Call AI to grade a question/answer pair.
 * Returns a JSON object with { correct, explanation, hint, feedback }.
 */
export async function callAIGrader(question, userAnswerRaw) {
  const acceptedKeywords = Array.isArray(question.acceptedKeywords)
    ? question.acceptedKeywords
    : [];

  const payload = {
    question: question.question,
    userAnswer: userAnswerRaw,
    correctAnswer:
      typeof question.correctAnswer === "string" ? question.correctAnswer : "",
    acceptedKeywords,
    explanation: question.explanation || "",
    hint: question.hint || "",
  };

  try {
    const client = getClient();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a grading assistant. Return JSON only. Never reveal the correct answer when wrong. Normalize comparisons: ignore case, punctuation, minor wording differences. If ANY accepted keyword appears in the normalized user answer, mark correct.",
        },
        {
          role: "user",
          content: `Question: ${payload.question}
User Answer: ${payload.userAnswer}
Expected Answer: ${payload.correctAnswer || "none"}
Accepted Keywords: ${acceptedKeywords.join(", ") || "none"}
Explanation (use if correct): ${payload.explanation}
Hint (use if wrong): ${payload.hint}

Rules:
- Normalize (lowercase, strip punctuation, collapse whitespace).
- Correct if normalized user answer equals expected OR contains ANY accepted keyword.
- If correct: {"correct": true, "explanation": "<explanation>", "feedback": "positive reinforcement"}.
- If wrong: {"correct": false, "hint": "<hint>", "feedback": "encouragement only"}.
Return JSON only.`,
        },
      ],
      temperature: 0,
    });

    let result;
    try {
      result = JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error("❌ Failed to parse AI response:", err);
      return {
        correct: false,
        hint: "Error grading answer.",
        feedback: "Please try again.",
      };
    }

    return result;
  } catch (err) {
    console.error("❌ AI grading error:", err);
    return {
      correct: false,
      hint: "Grading service unavailable.",
      feedback: "Try again later.",
    };
  }
}
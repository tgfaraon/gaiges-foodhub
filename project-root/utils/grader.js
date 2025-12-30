import { callAIGrader } from './aiGrader.js';

// Normalize helper
const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')        // strip punctuation
    .replace(/\b(a|an|the)\b/g, '') // drop common articles
    .replace(/\s+/g, ' ')
    .trim();

// Keyword check (any keyword counts)
const containsAnyKeyword = (text, keywords = []) => {
  const t = normalize(text);
  return keywords.some((kw) => t.includes(normalize(kw)));
};

// Flexible free-text match
const matchesAnswer = (userAnswer, correctAnswer) => {
  const ua = normalize(userAnswer);
  const ca = normalize(correctAnswer);
  if (!ca) return false;

  // exact
  if (ua === ca) return true;

  // partial (either direction)
  if (ua.includes(ca) || ca.includes(ua)) return true;

  // simple possessive handling: chefs vs chef / chef's
  const uaNoS = ua.replace(/\bchefs\b/g, 'chef');
  const caNoS = ca.replace(/\bchefs\b/g, 'chef');
  if (uaNoS === caNoS || uaNoS.includes(caNoS) || caNoS.includes(uaNoS)) return true;

  return false;
};

async function gradeQuestion(question, userAnswerRaw) {
  let correct = false;
  let explanation = question.explanation || '';

  try {
    // 1) Keywords
    if (Array.isArray(question.acceptedKeywords) && question.acceptedKeywords.length > 0) {
      correct = containsAnyKeyword(userAnswerRaw, question.acceptedKeywords);
    }

    // 2) Correct answer string
    if (!correct && typeof question.correctAnswer === 'string') {
      correct = matchesAnswer(userAnswerRaw, question.correctAnswer);
    }

    // 3) AI fallback
    if (!correct) {
      const aiResult = await callAIGrader(question, userAnswerRaw);
      correct = !!aiResult.correct;
      explanation = aiResult.explanation || explanation;
    }
  } catch (err) {
    console.error('Grading error:', err);
    explanation = explanation || 'Error during grading';
  }

  return {
    question: question.question,
    userAnswer: userAnswerRaw,
    correct,
    explanation,
  };
}

export async function gradeQuiz(quiz, answers) {
  const results = [];
  for (let i = 0; i < quiz.length; i++) {
    const q = quiz[i];
    const ans = answers[i] || '';
    const graded = await gradeQuestion(q, ans);
    results.push(graded);
  }
  return results;
}
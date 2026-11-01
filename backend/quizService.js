import { randomUUID } from 'crypto';

const QUIZ_SESSION_TTL_MS = 10 * 60 * 1000;
const quizSessions = new Map();

const validSubjects = new Set(['DSA', 'Core Subjects', 'Aptitude']);
const validDifficulties = new Set(['Easy', 'Medium', 'Hard']);

function pruneExpiredSessions() {
  const now = Date.now();

  for (const [sessionId, session] of quizSessions.entries()) {
    if (now - session.createdAt > QUIZ_SESSION_TTL_MS) {
      quizSessions.delete(sessionId);
    }
  }
}

function normalizeQuestionCount(value) {
  const count = Number(value);
  if (!Number.isInteger(count) || (count !== 5 && count !== 10)) {
    throw new Error('Question count must be 5 or 10.');
  }

  return count;
}

function normalizeSubject(value) {
  const subject = String(value || '').trim();
  if (!validSubjects.has(subject)) {
    throw new Error('Invalid subject selected.');
  }

  return subject;
}

function normalizeTopic(subject, topic) {
  const value = String(topic || '').trim();
  const allowedTopics = {
    DSA: ['Arrays', 'Strings', 'Linked Lists', 'Stacks and Queues', 'Searching and Sorting', 'Trees', 'Graphs'],
    'Core Subjects': ['DBMS', 'Operating Systems', 'Computer Networks', 'OOPS'],
    Aptitude: ['Percentages', 'Profit and Loss', 'Time and Work', 'Logical Reasoning', 'Quantitative Aptitude'],
  };

  if (!allowedTopics[subject]?.includes(value)) {
    throw new Error('Invalid topic selected for the chosen subject.');
  }

  return value;
}

function normalizeDifficulty(value) {
  const difficulty = String(value || '').trim();
  if (!validDifficulties.has(difficulty)) {
    throw new Error('Invalid difficulty selected.');
  }

  return difficulty;
}

function extractJsonPayload(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('AI returned an empty response.');
  }

  const cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response did not include valid JSON.');
  }

  const jsonText = cleaned.slice(start, end + 1);
  return JSON.parse(jsonText);
}

function validateQuestionSet(payload, expectedCount) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Quiz payload is missing.');
  }

  const { subject, topic, difficulty, questions } = payload;

  if (typeof subject !== 'string' || typeof topic !== 'string' || typeof difficulty !== 'string') {
    throw new Error('Quiz payload missing required metadata.');
  }

  if (!Array.isArray(questions) || questions.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} questions, but received ${Array.isArray(questions) ? questions.length : 0}.`);
  }

  const seenQuestions = new Set();

  const normalizedQuestions = questions.map((question, index) => {
    if (!question || typeof question !== 'object') {
      throw new Error(`Question ${index + 1} is malformed.`);
    }

    const id = Number(question.id);
    const text = String(question.question || '').trim();
    const options = Array.isArray(question.options) ? question.options.map((option) => String(option).trim()) : [];
    const correctAnswer = String(question.correctAnswer || '').trim();
    const explanation = String(question.explanation || '').trim();

    if (!Number.isInteger(id) || id < 1 || !text || options.length !== 4 || options.some((option) => !option)) {
      throw new Error(`Question ${index + 1} is missing required fields.`);
    }

    if (!options.includes(correctAnswer)) {
      throw new Error(`Correct answer for question ${index + 1} is not part of the provided options.`);
    }

    if (!explanation) {
      throw new Error(`Explanation is missing for question ${index + 1}.`);
    }

    const lowered = text.toLowerCase();
    if (seenQuestions.has(lowered)) {
      throw new Error('Duplicate questions were generated in the same test.');
    }
    seenQuestions.add(lowered);

    const uniqueOptions = new Set(options);
    if (uniqueOptions.size !== options.length) {
      throw new Error(`Question ${index + 1} contains duplicate answer options.`);
    }

    return {
      id,
      question: text,
      options,
      correctAnswer,
      explanation,
    };
  });

  return {
    subject,
    topic,
    difficulty,
    questions: normalizedQuestions,
  };
}

function buildQuizGenerationMessage({ subject, topic, difficulty, questionCount }) {
  return [
    {
      role: 'system',
      content:
        'You are a precise exam generator for placement preparation. Generate only valid JSON in the exact schema requested. Do not include markdown fences, commentary, or extra text outside JSON.',
    },
    {
      role: 'user',
      content: `Generate ${questionCount} multiple-choice questions for ${subject} on the topic ${topic}. Difficulty: ${difficulty}. Each question must have exactly 4 options and exactly one correct answer. Keep the questions factual, relevant, and technically accurate. Avoid duplication across the set. Return JSON with this schema: { "subject": "DSA", "topic": "Arrays", "difficulty": "Easy", "questions": [{ "id": 1, "question": "...", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": "Option A", "explanation": "..." }] } Ensure correctAnswer matches one of the options exactly and the explanation is short.`,
    },
  ];
}

async function generateRemark({ subject, topic, difficulty, totalQuestions, correctAnswers, incorrectAnswers, unanswered, percentage, groqClient }) {
  if (!groqClient) {
    const scoreBand = percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Needs focus';
    if (percentage >= 80) {
      return {
        remark: `You have demonstrated strong understanding of ${topic} in ${subject}.`,
        recommendation: `Move to a higher difficulty level or the next topic to keep building confidence.`,
      };
    }

    if (percentage >= 60) {
      return {
        remark: `You have a solid base in ${topic}, but there is room to improve accuracy.`,
        recommendation: `Revise the topic and attempt another timed practice test to strengthen weak areas.`,
      };
    }

    return {
      remark: `Your understanding of ${topic} needs more attention before moving forward.`,
      recommendation: `Revisit the concepts in ${subject} with focused practice on ${topic} and retake a test after revision.`,
    };
  }

  const completion = await groqClient.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      {
        role: 'system',
        content:
          'You are a placement mentor. Return only valid JSON with two string keys: remark and recommendation. The remark and recommendation must be based on the actual evaluation data provided and must reflect the exact score and performance details.',
      },
      {
        role: 'user',
        content: `Subject: ${subject}. Topic: ${topic}. Difficulty: ${difficulty}. Total Questions: ${totalQuestions}. Correct Answers: ${correctAnswers}. Incorrect Answers: ${incorrectAnswers}. Unanswered: ${unanswered}. Score Percentage: ${percentage}. Generate a short, motivating performance remark and a concise recommendation. Keep the recommendation actionable and specific to the selected topic. Return JSON only: {"remark":"...","recommendation":"..."}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 300,
  });

  const rawContent = completion.choices?.[0]?.message?.content || '';
  const payload = extractJsonPayload(rawContent);

  if (!payload || typeof payload.remark !== 'string' || typeof payload.recommendation !== 'string') {
    throw new Error('AI performance summary was malformed.');
  }

  return {
    remark: payload.remark.trim(),
    recommendation: payload.recommendation.trim(),
  };
}

export async function createQuizSession({ subject, topic, difficulty, questionCount, groqClient }) {
  pruneExpiredSessions();

  const cleanSubject = normalizeSubject(subject);
  const cleanTopic = normalizeTopic(cleanSubject, topic);
  const cleanDifficulty = normalizeDifficulty(difficulty);
  const totalQuestions = normalizeQuestionCount(questionCount);

  if (!groqClient) {
    throw new Error('Groq is not configured.');
  }

  const completion = await groqClient.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: buildQuizGenerationMessage({
      subject: cleanSubject,
      topic: cleanTopic,
      difficulty: cleanDifficulty,
      questionCount: totalQuestions,
    }),
    temperature: 0.6,
    max_tokens: 2500,
  });

  const rawContent = completion.choices?.[0]?.message?.content || '';
  const payload = extractJsonPayload(rawContent);
  const validatedPayload = validateQuestionSet(payload, totalQuestions);

  const sessionId = randomUUID();
  const session = {
    sessionId,
    subject: validatedPayload.subject,
    topic: validatedPayload.topic,
    difficulty: validatedPayload.difficulty,
    questionCount: totalQuestions,
    questions: validatedPayload.questions,
    answerKey: Object.fromEntries(validatedPayload.questions.map((question) => [String(question.id), question.correctAnswer])),
    createdAt: Date.now(),
  };

  quizSessions.set(sessionId, session);

  return {
    sessionId,
    subject: session.subject,
    topic: session.topic,
    difficulty: session.difficulty,
    questions: session.questions.map(({ id, question, options }) => ({ id, question, options })),
  };
}

export async function evaluateQuizSession({ sessionId, answers, groqClient }) {
  pruneExpiredSessions();
  const session = quizSessions.get(sessionId);

  if (!session) {
    throw new Error('Quiz session has expired or is invalid. Please generate a new test.');
  }

  const submittedAnswers = answers && typeof answers === 'object' ? answers : {};
  let correctAnswers = 0;
  let unanswered = 0;

  const review = session.questions.map((question) => {
    const selectedValue = submittedAnswers[String(question.id)] ?? submittedAnswers[question.id] ?? null;
    const normalizedSelection = typeof selectedValue === 'string' ? selectedValue.trim() : selectedValue;
    const isCorrect = typeof normalizedSelection === 'string' && normalizedSelection === question.correctAnswer;

    if (!normalizedSelection) {
      unanswered += 1;
    }

    if (isCorrect) {
      correctAnswers += 1;
    }

    return {
      id: question.id,
      question: question.question,
      selectedAnswer: normalizedSelection || null,
      correctAnswer: question.correctAnswer,
      isCorrect,
      explanation: question.explanation,
      options: question.options,
    };
  });

  const incorrectAnswers = session.questions.length - correctAnswers - unanswered;
  const percentage = session.questions.length > 0 ? Math.round((correctAnswers / session.questions.length) * 100) : 0;

  const summaryResult = await generateRemark({
    subject: session.subject,
    topic: session.topic,
    difficulty: session.difficulty,
    totalQuestions: session.questions.length,
    correctAnswers,
    incorrectAnswers,
    unanswered,
    percentage,
    groqClient,
  });

  quizSessions.delete(sessionId);

  return {
    subject: session.subject,
    topic: session.topic,
    difficulty: session.difficulty,
    totalQuestions: session.questions.length,
    correctAnswers,
    incorrectAnswers,
    unanswered,
    percentage,
    remark: summaryResult.remark,
    recommendation: summaryResult.recommendation,
    review,
  };
}

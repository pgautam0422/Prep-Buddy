import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { evaluateQuiz, generateQuiz } from '../lib/api';

const SUBJECT_TOPICS = {
  DSA: ['Arrays', 'Strings', 'Linked Lists', 'Stacks and Queues', 'Searching and Sorting', 'Trees', 'Graphs'],
  'Core Subjects': ['DBMS', 'Operating Systems', 'Computer Networks', 'OOPS'],
  Aptitude: ['Percentages', 'Profit and Loss', 'Time and Work', 'Logical Reasoning', 'Quantitative Aptitude'],
};

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];
const QUESTION_OPTIONS = [5, 10];

const getTimerLimit = (questionCount) => (Number(questionCount) === 10 ? 600 : 300);

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const getPerformanceTone = (percentage) => {
  if (percentage >= 80) {
    return {
      label: 'Strong performance',
      classes: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    };
  }

  if (percentage >= 60) {
    return {
      label: 'Average performance',
      classes: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
    };
  }

  return {
    label: 'Needs improvement',
    classes: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  };
};

const AIQuiz = () => {
  const [config, setConfig] = useState({
    subject: 'DSA',
    topic: SUBJECT_TOPICS.DSA[0],
    difficulty: 'Easy',
    questionCount: 5,
  });

  const [quizState, setQuizState] = useState({
    step: 'config',
    loading: false,
    error: '',
    sessionId: '',
    questions: [],
    currentIndex: 0,
    answers: {},
    timeLeft: 300,
    isSubmitting: false,
    result: null,
  });

  useEffect(() => {
    setConfig((prev) => {
      const allowedTopics = SUBJECT_TOPICS[prev.subject] || [];
      if (!allowedTopics.includes(prev.topic)) {
        return { ...prev, topic: allowedTopics[0] || '' };
      }
      return prev;
    });
  }, [config.subject]);

  useEffect(() => {
    if (quizState.step !== 'quiz') {
      return undefined;
    }

    if (quizState.timeLeft <= 0) {
      handleSubmitQuiz(true);
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setQuizState((prev) => ({
        ...prev,
        timeLeft: prev.step === 'quiz' ? Math.max(0, prev.timeLeft - 1) : prev.timeLeft,
      }));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [quizState.step, quizState.timeLeft]);

  const availableTopics = useMemo(() => SUBJECT_TOPICS[config.subject] || [], [config.subject]);
  const currentQuestion = quizState.questions[quizState.currentIndex] || null;
  const totalQuestions = quizState.questions.length;
  const progressPercent = totalQuestions > 0 ? ((quizState.currentIndex + 1) / totalQuestions) * 100 : 0;

  const setFieldValue = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const generateFreshTest = async (requestedConfig = config) => {
    setQuizState((prev) => ({
      ...prev,
      loading: true,
      error: '',
    }));

    try {
      const payload = await generateQuiz({
        subject: requestedConfig.subject,
        topic: requestedConfig.topic,
        difficulty: requestedConfig.difficulty,
        questionCount: Number(requestedConfig.questionCount),
      });

      setQuizState({
        step: 'quiz',
        loading: false,
        error: '',
        sessionId: payload.sessionId,
        questions: payload.questions,
        currentIndex: 0,
        answers: {},
        timeLeft: getTimerLimit(payload.questions.length),
        isSubmitting: false,
        result: null,
      });
    } catch (error) {
      setQuizState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Unable to generate a quiz right now. Please try again.',
      }));
    }
  };

  const handleGenerateTest = async () => {
    if (!config.subject || !config.topic || !config.difficulty || !config.questionCount) {
      setQuizState((prev) => ({ ...prev, error: 'Please complete all test configuration fields.' }));
      return;
    }

    await generateFreshTest(config);
  };

  const handleAnswerChange = (questionId, option) => {
    setQuizState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: option,
      },
    }));
  };

  const handleNext = () => {
    if (!currentQuestion) {
      return;
    }

    setQuizState((prev) => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.questions.length - 1),
    }));
  };

  const handlePrevious = () => {
    setQuizState((prev) => ({
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0),
    }));
  };

  const handleExitTest = () => {
    const confirmed = window.confirm('Exit this practice test? Your current progress will be lost.');
    if (!confirmed) return;

    setQuizState({
      step: 'config',
      loading: false,
      error: '',
      sessionId: '',
      questions: [],
      currentIndex: 0,
      answers: {},
      timeLeft: getTimerLimit(config.questionCount),
      isSubmitting: false,
      result: null,
    });
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (quizState.isSubmitting) {
      return;
    }

    if (!autoSubmit && !window.confirm('Submit the quiz? You will not be able to change answers after this.')) {
      return;
    }

    setQuizState((prev) => ({
      ...prev,
      isSubmitting: true,
      error: '',
    }));

    try {
      const result = await evaluateQuiz({
        sessionId: quizState.sessionId,
        answers: quizState.answers,
      });

      setQuizState((prev) => ({
        ...prev,
        step: 'result',
        isSubmitting: false,
        result,
      }));
    } catch (error) {
      setQuizState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: error.message || 'Failed to evaluate your test. Please try again.',
      }));
    }
  };

  const handleRetakeTest = async () => {
    await generateFreshTest(config);
  };

  const handleBackToConfig = () => {
    setQuizState({
      step: 'config',
      loading: false,
      error: '',
      sessionId: '',
      questions: [],
      currentIndex: 0,
      answers: {},
      timeLeft: getTimerLimit(config.questionCount),
      isSubmitting: false,
      result: null,
    });
  };

  const tone = quizState.result ? getPerformanceTone(quizState.result.percentage) : null;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
      {quizState.step === 'config' ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel max-w-3xl mx-auto p-6 md:p-8 rounded-3xl"
        >
          <div className="text-center mb-8">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] text-[#8b5cf6] font-bold">PRACTICE</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mt-3">Test Your Preparation</h1>
          </div>

          <div className="grid gap-5 sm:gap-6">
            <div className="grid gap-3">
              <label className="text-sm font-semibold text-slate-200">Subject</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.keys(SUBJECT_TOPICS).map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => setFieldValue('subject', subject)}
                    className={`rounded-2xl border px-4 py-3 text-left font-semibold transition-all duration-200 ${
                      config.subject === subject
                        ? 'border-[#8b5cf6]/60 bg-[#8b5cf6]/15 text-white shadow-lg shadow-purple-500/10'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-semibold text-slate-200">Topics</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setFieldValue('topic', topic)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                      config.topic === topic
                        ? 'border-[#06b6d4]/60 bg-[#06b6d4]/10 text-white shadow-lg shadow-cyan-500/10'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-semibold text-slate-200">Difficulty</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DIFFICULTY_OPTIONS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFieldValue('difficulty', level)}
                    className={`rounded-2xl border px-4 py-3 font-semibold transition-all duration-200 ${
                      config.difficulty === level
                        ? 'border-[#f59e0b]/60 bg-[#f59e0b]/10 text-white shadow-lg shadow-amber-500/10'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-semibold text-slate-200">Number of Questions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUESTION_OPTIONS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setFieldValue('questionCount', count)}
                    className={`rounded-2xl border px-4 py-3 font-semibold transition-all duration-200 ${
                      config.questionCount === count
                        ? 'border-[#10b981]/60 bg-[#10b981]/10 text-white shadow-lg shadow-emerald-500/10'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          {quizState.error ? (
            <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {quizState.error}
            </div>
          ) : null}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={handleGenerateTest}
            disabled={quizState.loading}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-[#f59e0b] via-[#8b5cf6] to-[#06b6d4] px-5 py-4 text-lg font-black text-white shadow-xl shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {quizState.loading ? 'Generating Test...' : 'Generate Test'}
          </motion.button>
        </motion.div>
      ) : null}

      {quizState.step === 'quiz' ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-panel rounded-3xl p-5 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Practice Test</p>
                <h2 className="text-2xl font-bold text-white mt-2">{config.topic}</h2>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleExitTest}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-rose-400/40 hover:text-white transition-all"
                >
                  Exit Test
                </button>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200">
                  {config.difficulty}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200">
                  {formatTime(quizState.timeLeft)}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-2">
                <span>Question {quizState.currentIndex + 1}</span>
                <span>of {totalQuestions}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-[#f59e0b] via-[#8b5cf6] to-[#06b6d4]" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          {currentQuestion ? (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel rounded-3xl p-6 md:p-7"
            >
              <h3 className="text-xl md:text-2xl font-semibold leading-relaxed text-white mb-6">
                {currentQuestion.question}
              </h3>

              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <label
                    key={option}
                    className={`flex items-start gap-4 rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
                      quizState.answers[currentQuestion.id] === option
                        ? 'border-[#8b5cf6]/60 bg-[#8b5cf6]/10 text-white'
                        : 'border-white/10 bg-slate-950/20 text-slate-200 hover:border-white/15 hover:bg-white/[0.04]'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={quizState.answers[currentQuestion.id] === option}
                      onChange={() => handleAnswerChange(currentQuestion.id, option)}
                      className="mt-1 h-4 w-4 accent-[#8b5cf6]"
                    />
                    <span className="text-base leading-7">{option}</span>
                  </label>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={quizState.currentIndex === 0}
                  className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <div className="flex gap-3">
                  {quizState.currentIndex < totalQuestions - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white"
                    >
                      Next
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleSubmitQuiz(false)}
                    disabled={quizState.isSubmitting}
                    className="rounded-2xl bg-gradient-to-r from-[#10b981] to-[#34a853] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {quizState.isSubmitting ? 'Submitting...' : 'Submit Test'}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </motion.div>
      ) : null}

      {quizState.step === 'result' && quizState.result ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <div className={`mb-6 rounded-3xl border p-6 ${tone?.classes}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-200">Result</p>
                <h2 className="text-3xl font-black mt-2 text-white">{quizState.result.subject} • {quizState.result.topic}</h2>
              </div>
              <div className="text-right">
                <p className="text-5xl font-black text-white">{quizState.result.percentage}%</p>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-200">{tone?.label}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {[
              ['Total Questions', quizState.result.totalQuestions],
              ['Correct', quizState.result.correctAnswers],
              ['Incorrect', quizState.result.incorrectAnswers],
              ['Unanswered', quizState.result.unanswered],
            ].map(([label, value]) => (
              <div key={label} className="glass-card rounded-2xl p-5">
                <p className="text-sm text-slate-400">{label}</p>
                <p className="text-3xl font-bold text-white mt-3">{value}</p>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-3xl p-6 mb-8">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Performance Summary</p>
            <h3 className="text-2xl font-bold text-white mt-3">{quizState.result.remark}</h3>
            <p className="mt-3 text-slate-200 leading-7">{quizState.result.recommendation}</p>
          </div>

          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h3 className="text-2xl font-bold text-white">Answer Review</h3>
              <div className="text-sm text-slate-300">Difficulty: {quizState.result.difficulty}</div>
            </div>

            <div className="space-y-5">
              {quizState.result.review.map((item, index) => {
                const statusText = item.isCorrect ? 'Correct' : item.selectedAnswer ? 'Incorrect' : 'Unanswered';
                const statusClasses = item.isCorrect
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : item.selectedAnswer
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                    : 'border-slate-500/40 bg-slate-500/10 text-slate-200';

                return (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <p className="text-lg font-semibold text-white">
                        {index + 1}. {item.question}
                      </p>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClasses}`}>
                        {statusText}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">Your answer</p>
                        <p className="text-slate-100">{item.selectedAnswer || 'No answer selected'}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">Correct answer</p>
                        <p className="text-slate-100">{item.correctAnswer}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-[#8b5cf6]/30 bg-[#8b5cf6]/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300 mb-1">Explanation</p>
                      <p className="text-slate-200 leading-7">{item.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              onClick={handleRetakeTest}
              className="rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] px-6 py-3 font-bold text-white"
            >
              Retake Test
            </button>
            <button
              type="button"
              onClick={handleBackToConfig}
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-bold text-white"
            >
              Back to AI Test
            </button>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
};

export default AIQuiz;

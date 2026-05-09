import { useState } from 'react';
import {
  Loader2, GraduationCap, CheckCircle2, XCircle,
  RotateCcw, ChevronRight, Trophy, Target
} from 'lucide-react';
import { generateQuiz } from '../services/api';

export default function TutorMode({ documents }) {
  const [config, setConfig] = useState({
    topic: '',
    docId: '',
    numQuestions: 5,
    questionType: 'mcq',
  });
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quizDone, setQuizDone] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentQ(0);
    setAnswers({});
    setRevealed({});
    setQuizDone(false);

    try {
      const result = await generateQuiz({
        topic: config.topic || undefined,
        docId: config.docId || undefined,
        numQuestions: config.numQuestions,
        questionType: config.questionType,
      });
      setQuestions(result.questions);
    } catch (err) {
      setError(err.response?.data?.detail || 'Quiz generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (qIndex, answer) => {
    if (revealed[qIndex]) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: answer }));
    
    // For MCQ, reveal immediately for instant feedback
    if (questions[qIndex].choices?.length > 0) {
      setRevealed((prev) => ({ ...prev, [qIndex]: true }));
    }
  };

  const revealAnswer = (qIndex) => {
    setRevealed((prev) => ({ ...prev, [qIndex]: true }));
  };

  const finishQuiz = () => {
    // Reveal all remaining
    const allRevealed = {};
    questions.forEach((_, i) => { allRevealed[i] = true; });
    setRevealed(allRevealed);
    setQuizDone(true);
  };

  const score = Object.entries(answers).filter(([i, a]) => {
    const q = questions[parseInt(i)];
    if (!q) return false;
    return a.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
  }).length;

  const totalAnswered = Object.keys(answers).length;

  // ── Config view ──────────────────────────────────────
  if (questions.length === 0 && !loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-5 border-b border-surface-200 bg-surface-50">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-primary-100">
              <GraduationCap className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900">Tutor Mode</h2>
              <p className="text-xs text-surface-500 font-medium">Auto-generate quizzes from your corpus</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-lg mx-auto space-y-5">
            {/* Topic */}
            <div>
              <label className="block text-xs text-surface-400 mb-1.5 font-medium uppercase tracking-wider">
                Topic (optional)
              </label>
              <input
                type="text"
                value={config.topic}
                onChange={(e) => setConfig((c) => ({ ...c, topic: e.target.value }))}
                placeholder="e.g. Machine Learning, Photosynthesis..."
                className="
                  w-full px-4 py-3 rounded-xl text-sm font-medium
                  bg-surface-50 border border-surface-300 shadow-sm
                  text-surface-900 placeholder:text-surface-400
                  focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                  transition-colors
                "
              />
            </div>

            {/* Document selector */}
            <div>
              <label className="block text-xs text-surface-400 mb-1.5 font-medium uppercase tracking-wider">
                Source Document
              </label>
              <select
                value={config.docId}
                onChange={(e) => setConfig((c) => ({ ...c, docId: e.target.value }))}
                className="
                  w-full px-4 py-3 rounded-xl text-sm font-medium
                  bg-surface-50 border border-surface-300 shadow-sm
                  text-surface-900 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                  transition-colors
                "
              >
                <option value="">All Documents</option>
                {documents.map((doc) => (
                  <option key={doc.doc_id} value={doc.doc_id}>
                    {doc.filename}
                  </option>
                ))}
              </select>
            </div>

            {/* Question count + type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-surface-400 mb-1.5 font-medium uppercase tracking-wider">
                  Questions
                </label>
                <select
                  value={config.numQuestions}
                  onChange={(e) => setConfig((c) => ({ ...c, numQuestions: parseInt(e.target.value) }))}
                  className="
                    w-full px-4 py-3 rounded-xl text-sm font-medium
                    bg-surface-50 border border-surface-300 shadow-sm
                    text-surface-900 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                    transition-colors
                  "
                >
                  {[3, 5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1.5 font-medium uppercase tracking-wider">
                  Type
                </label>
                <select
                  value={config.questionType}
                  onChange={(e) => setConfig((c) => ({ ...c, questionType: e.target.value }))}
                  className="
                    w-full px-4 py-3 rounded-xl text-sm font-medium
                    bg-surface-50 border border-surface-300 shadow-sm
                    text-surface-900 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                    transition-colors
                  "
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={documents.length === 0}
              className="
                w-full py-3.5 rounded-xl font-bold text-sm text-white
                bg-primary-500 hover:bg-primary-600
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200
                shadow-lg shadow-primary-500/20
                flex items-center justify-center gap-2
              "
            >
              <GraduationCap className="w-5 h-5" />
              Generate Quiz
            </button>

            {error && (
              <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20">
                <p className="text-sm text-accent-rose">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fade-in-up">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
        <p className="text-surface-500 font-medium">Generating quiz questions...</p>
        <p className="text-surface-500 text-sm mt-1">Analyzing your documents with AI</p>
        <div className="mt-4 h-2 w-64 rounded-full shimmer" />
      </div>
    );
  }

  // ── Quiz done — score card ───────────────────────────
  if (quizDone) {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Score card */}
          <div className="max-w-md mx-auto text-center mb-8 animate-fade-in-up">
            <div className="p-6 rounded-3xl bg-surface-50 border border-surface-200 shadow-sm mb-4">
              <Trophy className={`w-14 h-14 mx-auto mb-3 ${pct >= 70 ? 'text-primary-500' : 'text-surface-400'}`} />
              <p className="text-4xl font-bold text-surface-900 mb-1">
                {score}/{questions.length}
              </p>
              <p className="text-surface-500 font-medium text-sm">
                {pct >= 90 ? 'Outstanding! 🎉' : pct >= 70 ? 'Great job! 👏' : pct >= 50 ? 'Good effort! 📚' : 'Keep studying! 💪'}
              </p>
              <div className="mt-4 h-3 bg-surface-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    pct >= 70 ? 'bg-primary-500' : 'bg-accent-amber'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => { setQuestions([]); setQuizDone(false); }}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-surface-200 hover:bg-surface-300 text-surface-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              New Quiz
            </button>
          </div>

          {/* Review questions */}
          <div className="max-w-2xl mx-auto space-y-4">
            {questions.map((q, i) => {
              const userAnswer = answers[i];
              const isCorrect = userAnswer?.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();

              return (
                <div key={i} className={`bg-surface-50 shadow-sm rounded-2xl p-5 border ${isCorrect ? 'border-accent-emerald/50' : 'border-accent-rose/50'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
                      {i + 1}
                    </span>
                    <p className="text-surface-900 font-medium text-sm leading-relaxed">{q.question}</p>
                  </div>
                  <div className="ml-10 text-xs font-medium space-y-1">
                    {userAnswer && !isCorrect && (
                      <p className="text-accent-rose">Your answer: {userAnswer}</p>
                    )}
                    <p className="text-accent-emerald">Correct: {q.correct_answer}</p>
                    {q.explanation && (
                      <p className="text-surface-500 mt-2 italic">{q.explanation}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Active quiz ──────────────────────────────────────
  const q = questions[currentQ];

  return (
    <div className="flex flex-col h-full items-center justify-center bg-surface-50 p-4 sm:p-8">
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-surface-200/50 border border-surface-200 w-full max-w-2xl max-h-full flex flex-col overflow-hidden animate-fade-in-up">
      {/* Progress bar */}
      <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-surface-500 font-bold">
            Question {currentQ + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-primary-500" />
            <span className="text-xs text-primary-500 font-bold">{score} correct</span>
          </div>
        </div>
        <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 px-8 py-8 overflow-y-auto">
        <div>
          <p className="text-xl sm:text-2xl text-surface-900 font-extrabold leading-tight mb-8">
            {q.question}
          </p>

          {/* Choices */}
          {q.choices?.length > 0 ? (
            <div className="space-y-3">
              {q.choices.map((choice, ci) => {
                const isSelected = answers[currentQ] === choice;
                const isRevealed = revealed[currentQ];
                const isCorrect = choice.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();

                let choiceStyle = 'border-surface-200 hover:border-primary-500/30 hover:bg-surface-50 bg-white';
                if (isSelected && !isRevealed) {
                  choiceStyle = 'border-primary-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-primary-50/50';
                } else if (isRevealed && isCorrect) {
                  choiceStyle = 'border-primary-500 bg-primary-50';
                } else if (isRevealed && isSelected && !isCorrect) {
                  choiceStyle = 'border-accent-rose/50 bg-accent-rose/10';
                }

                return (
                  <button
                    key={ci}
                    onClick={() => selectAnswer(currentQ, choice)}
                    disabled={isRevealed}
                    className={`
                      w-full text-left px-5 py-4 rounded-xl border
                      text-sm font-medium text-surface-900 transition-all duration-200
                      flex items-center gap-3
                      ${choiceStyle}
                      disabled:cursor-default shadow-sm
                    `}
                  >
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-surface-200 flex items-center justify-center text-xs font-bold text-surface-600">
                      {String.fromCharCode(65 + ci)}
                    </span>
                    <span className="flex-1">{choice}</span>
                    {isRevealed && isCorrect && <CheckCircle2 className="w-6 h-6 text-primary-500 shrink-0" />}
                    {isRevealed && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-accent-rose shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Short answer */
            <input
              type="text"
              value={answers[currentQ] || ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ]: e.target.value }))}
              disabled={revealed[currentQ]}
              placeholder="Type your answer..."
              className="
                w-full px-5 py-4 rounded-xl text-sm font-medium
                bg-surface-50 border border-surface-300 shadow-sm
                text-surface-900 placeholder:text-surface-400
                focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                transition-colors disabled:opacity-50
              "
            />
          )}

          {/* Explanation */}
          {revealed[currentQ] && q.explanation && (
            <div className="mt-4 p-4 rounded-xl bg-primary-50 border border-primary-200 animate-fade-in-up">
              <p className="text-xs text-primary-600 font-bold mb-1">Explanation</p>
              <p className="text-sm text-surface-700 font-medium leading-relaxed">{q.explanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-surface-200 bg-surface-50 flex items-center justify-between">
        <button
          onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
          disabled={currentQ === 0}
          className="px-4 py-2 rounded-xl text-sm font-bold text-surface-500 hover:text-surface-900 hover:bg-surface-200 transition-colors disabled:opacity-30"
        >
          Previous
        </button>

        <div className="flex gap-3">
          {!revealed[currentQ] && answers[currentQ] !== undefined && (
            <button
              onClick={() => revealAnswer(currentQ)}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-primary-500 hover:bg-primary-600 text-white transition-colors"
            >
              Check Answer
            </button>
          )}

          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((p) => p + 1)}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-surface-200 hover:bg-surface-300 text-surface-700 transition-colors flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finishQuiz}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-primary-500 hover:bg-primary-600 text-white transition-colors"
            >
              Finish Quiz
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

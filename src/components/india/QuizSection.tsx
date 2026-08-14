"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Check, X, RotateCcw, Trophy, Sparkles } from "lucide-react";
import { AshokaChakra } from "./AshokaChakra";
import { SectionHeader } from "./FreedomFightersSection";

interface Question {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    q: "On which date did India officially become independent?",
    options: ["15 August 1947", "14 August 1947", "26 January 1950", "2 October 1947"],
    correct: 0,
    explanation: "India gained independence on 15 August 1947, when Jawaharlal Nehru delivered his 'Tryst with Destiny' speech at midnight.",
  },
  {
    q: 'Who gave the immortal slogan "Jai Hind"?',
    options: ["Mahatma Gandhi", "Subhas Chandra Bose", "Bhagat Singh", "Sardar Patel"],
    correct: 1,
    explanation: "Subhas Chandra Bose, Netaji, popularized 'Jai Hind' as the greeting of the Indian National Army. It is now India's official salutation.",
  },
  {
    q: "Where was the Quit India Movement launched in 1942?",
    options: ["Delhi", "Bombay (Mumbai)", "Calcutta (Kolkata)", "Madras (Chennai)"],
    correct: 1,
    explanation: "The Quit India Resolution was passed at the Bombay session of the All India Congress Committee at Gowalia Tank Maidan on 8 August 1942.",
  },
  {
    q: "Who designed the Indian national flag (Tiranga)?",
    options: ["Mahatma Gandhi", "Pingali Venkayya", "Sarojini Naidu", "Rabindranath Tagore"],
    correct: 1,
    explanation: "Pingali Venkayya designed the basic flag in 1921. It was modified and adopted in its final form on 22 July 1947 by the Constituent Assembly.",
  },
  {
    q: "What does the Ashoka Chakra on the flag represent?",
    options: [
      "The 24 hours of the day",
      "The 24 spokes of virtue",
      "The wheel of law (Dharma)",
      "All of the above",
    ],
    correct: 3,
    explanation: "The 24-spoked Ashoka Chakra represents the wheel of law (Dharma), the 24 hours of the day, and the 24 virtues — symbolizing constant motion and progress.",
  },
  {
    q: "Who was the first woman President of the Indian National Congress?",
    options: ["Sarojini Naidu", "Annie Besant", "Indira Gandhi", "Vijaya Lakshmi Pandit"],
    correct: 1,
    explanation: "Annie Besant became the first woman president in 1917. Sarojini Naidu followed in 1925 as the first Indian woman president.",
  },
  {
    q: "In which year was the Jallianwala Bagh massacre?",
    options: ["1919", "1920", "1918", "1922"],
    correct: 0,
    explanation: "On 13 April 1919, British troops under Brigadier-General Dyer fired on unarmed civilians at Jallianwala Bagh, Amritsar, killing hundreds.",
  },
  {
    q: 'Who said, "Give me blood, and I shall give you freedom!"?',
    options: ["Bhagat Singh", "Subhas Chandra Bose", "Chandrashekhar Azad", "Mangal Pandey"],
    correct: 1,
    explanation: "Subhas Chandra Bose gave this rallying cry in 1944 while leading the Indian National Army against British forces.",
  },
  {
    q: "Which movement is associated with the Dandi Salt March?",
    options: ["Non-Cooperation Movement", "Quit India Movement", "Civil Disobedience Movement", "Swadeshi Movement"],
    correct: 2,
    explanation: "The Salt March of 1930, led by Gandhi, was the opening act of the Civil Disobedience Movement against the British salt tax.",
  },
  {
    q: "Who was the chief architect of the Indian Constitution?",
    options: ["Jawaharlal Nehru", "Sardar Patel", "Dr. B. R. Ambedkar", "Rajendra Prasad"],
    correct: 2,
    explanation: "Dr. B. R. Ambedkar, as Chairman of the Drafting Committee, is hailed as the chief architect of the Constitution of India.",
  },
  {
    q: "Who was the first Governor-General of independent India?",
    options: ["Lord Mountbatten", "C. Rajagopalachari", "Rajendra Prasad", "Lord Wavell"],
    correct: 0,
    explanation: "Lord Louis Mountbatten served as the first Governor-General of independent India (1947–48). C. Rajagopalachari succeeded him as the first Indian Governor-General.",
  },
  {
    q: 'Who composed the song "Vande Mataram"?',
    options: ["Rabindranath Tagore", "Bankim Chandra Chatterjee", "Sarojini Naidu", "Kavi Pradeep"],
    correct: 1,
    explanation: "Bankim Chandra Chatterjee composed 'Vande Mataram' in 1875. It was adopted as India's national song in 1950.",
  },
];

export function QuizSection() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleSelect = useCallback((idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === QUESTIONS[current].correct) {
      setScore((s) => s + 1);
    }
  }, [answered, current]);

  const handleNext = useCallback(() => {
    if (current + 1 >= QUESTIONS.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  }, [current]);

  const reset = useCallback(() => {
    setStarted(false);
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  }, []);

  if (!started) {
    return (
      <section id="quiz" className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-3xl mx-auto relative text-center">
          <SectionHeader
            eyebrow="Test Your Patriotism"
            deva="प्रश्नोत्तरी"
            title="Interactive Quiz"
            subtitle="12 questions on the journey of India. How well do you know your nation?"
          />
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setStarted(true)}
            className="mt-12 relative px-8 py-4 sm:px-10 sm:py-5 rounded-full overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-saffron via-white to-india-green" />
            <span className="relative text-[#060818] font-serif font-bold text-base sm:text-lg tracking-wide flex items-center gap-2">
              <Sparkles size={18} /> Begin the Quiz
            </span>
          </motion.button>
        </div>
      </section>
    );
  }

  if (finished) {
    return <QuizResult score={score} total={QUESTIONS.length} onReset={reset} />;
  }

  const question = QUESTIONS[current];
  const progress = ((current + (answered ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <section id="quiz" className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-3xl mx-auto relative">
        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between text-xs text-white/60 mb-2 font-mono">
            <span>Question {current + 1} of {QUESTIONS.length}</span>
            <span>Score: {score}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-saffron via-white to-india-green rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="glass-strong rounded-3xl p-6 sm:p-10 border border-gold/20"
          >
            <div className="flex items-start gap-4 mb-8">
              <div className="text-chakra-blue-light flex-shrink-0">
                <AshokaChakra size={36} spinDuration={30} />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white leading-tight">
                {question.q}
              </h3>
            </div>

            <div className="space-y-3">
              {question.options.map((opt, idx) => {
                const isCorrect = idx === question.correct;
                const isSelected = idx === selected;
                const showCorrect = answered && isCorrect;
                const showWrong = answered && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={idx}
                    whileHover={!answered ? { scale: 1.02, x: 4 } : {}}
                    whileTap={!answered ? { scale: 0.98 } : {}}
                    onClick={() => handleSelect(idx)}
                    disabled={answered}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                      showCorrect
                        ? "border-india-green bg-india-green/20 text-white"
                        : showWrong
                        ? "border-red-500 bg-red-500/20 text-white"
                        : answered
                        ? "border-white/10 bg-white/5 text-white/60"
                        : "border-white/15 bg-white/5 hover:border-gold/50 hover:bg-white/10 text-white/90 cursor-pointer"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs border ${
                        showCorrect ? "border-india-green bg-india-green text-white" :
                        showWrong ? "border-red-500 bg-red-500 text-white" :
                        "border-white/20 text-white/70"
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm sm:text-base">{opt}</span>
                    </span>
                    {showCorrect && <Check size={20} className="text-india-green" />}
                    {showWrong && <X size={20} className="text-red-400" />}
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {answered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-gradient-to-br from-gold/10 to-transparent border border-gold/30">
                    <p className="text-xs uppercase tracking-widest text-gold mb-2 font-semibold">
                      {selected === question.correct ? "✓ Correct!" : "✗ Not quite"}
                    </p>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    className="mt-6 w-full sm:w-auto sm:px-10 py-3.5 rounded-full bg-gradient-to-r from-saffron to-india-green text-[#060818] font-serif font-bold tracking-wide"
                  >
                    {current + 1 >= QUESTIONS.length ? "See Your Result →" : "Next Question →"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function QuizResult({ score, total, onReset }: { score: number; total: number; onReset: () => void }) {
  const percentage = (score / total) * 100;

  let title = "";
  let message = "";
  let emoji = "";
  if (percentage === 100) {
    title = "Bharat Ratna Knowledge!";
    message = "India knows your heart. 🇮🇳 You have mastered the story of a nation.";
    emoji = "🏆";
  } else if (percentage >= 80) {
    title = "True Patriot";
    message = "India knows your heart. 🇮🇳 Your love for the nation shines through every answer.";
    emoji = "🎖";
  } else if (percentage >= 60) {
    title = "Freedom Scholar";
    message = "Well done! India's story lives in you. Keep exploring, keep learning.";
    emoji = "⭐";
  } else if (percentage >= 40) {
    title = "Curious Citizen";
    message = "A good start! Revisit this journey — India has so many stories waiting for you.";
    emoji = "📚";
  } else {
    title = "The Journey Begins";
    message = "Every Indian's journey of discovery starts somewhere. Explore the timeline, meet the fighters, and try again.";
    emoji = "🌱";
  }

  return (
    <section id="quiz" className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-2xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong rounded-3xl p-8 sm:p-12 border border-gold/30 text-center relative overflow-hidden"
        >
          {/* Decorative chakra */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 text-gold/10">
            <AshokaChakra size={240} spinDuration={40} />
          </div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 text-saffron/10">
            <AshokaChakra size={180} spinDuration={30} reverse />
          </div>

          <div className="relative">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gold/30 to-saffron/30 border-2 border-gold mb-6"
            >
              <Trophy size={36} className="text-gold" />
            </motion.div>

            <div className="text-5xl mb-4">{emoji}</div>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold gold-text mb-3">
              {title}
            </h2>

            <div className="text-6xl font-serif font-bold mb-2">
              <span className="text-saffron text-glow-saffron">{score}</span>
              <span className="text-white/40">/</span>
              <span className="text-india-green">{total}</span>
            </div>

            <p className="text-sm text-white/70 max-w-md mx-auto mb-8 leading-relaxed">
              {message}
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={onReset}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-saffron via-white to-india-green text-[#060818] font-serif font-bold tracking-wide"
            >
              <RotateCcw size={16} /> Try Again
            </motion.button>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/40">
              <span>वन्दे मातरम्</span>
              <span>·</span>
              <span className="tracking-widest">VANDE MATARAM</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { AshokaChakra } from "./AshokaChakra";
import { WavingFlag } from "./WavingFlag";
import { SectionHeader } from "./FreedomFightersSection";

/**
 * "The Night Before Freedom" — a scroll-driven cinematic storytelling section.
 * Progression: 14 August 1947 → Midnight → 15 August 1947 → glowing Tiranga reveal.
 */
export function NightBeforeFreedomSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Background color transitions from twilight saffron to midnight blue to dawn green
  const bgColor = useTransform(
    scrollYProgress,
    [0, 0.4, 0.7, 1],
    ["#1a0a05", "#060818", "#02060f", "#0a1a05"]
  );

  const glowOpacity = useTransform(scrollYProgress, [0.5, 0.85, 1], [0, 0.5, 1]);

  return (
    <motion.section
      ref={ref}
      id="freedom"
      style={{ backgroundColor: bgColor }}
      className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden"
    >
      <div className="max-w-5xl mx-auto relative">
        <SectionHeader
          eyebrow="14 — 15 August 1947"
          deva="आज़ादी की रात"
          title="The Night Before Freedom"
          subtitle="Two hundred years of empire. One night that ended it all. Scroll slowly through the hours that turned subjects into citizens."
        />

        <div className="mt-24 space-y-32 sm:space-y-40">
          {/* 14 August 1947 — Evening */}
          <StoryBlock
            scrollProgress={scrollYProgress}
            range={[0.05, 0.20]}
            time="14 August 1947"
            timeLabel="Evening"
            title="The Final Sunset of Empire"
            text="Across India, ordinary people go about their evening — but they know something is coming. For the first time in two centuries, the British Raj will not see another sunrise over the subcontinent. In Delhi, the Constituent Assembly prepares. In cities and villages, radios crackle with anticipation. On the borders, a nation is being carved in two — freedom's price paid in displacement and blood. As the sun sets on the British Empire in India, three hundred million hearts beat with a single question: what does tomorrow hold?"
            color="#FF9933"
          />

          {/* Midnight */}
          <StoryBlock
            scrollProgress={scrollYProgress}
            range={[0.30, 0.55]}
            time="14 — 15 August 1947"
            timeLabel="The Stroke of Midnight"
            title='"At the stroke of the midnight hour..."'
            text='At the Constituent Assembly in New Delhi, as the clock strikes twelve, Jawaharlal Nehru rises to speak. His voice, carried by radio to every corner of the nation, delivers the words that will echo for generations: "At the stroke of the midnight hour, when the world sleeps, India will awake to life and freedom." Members take the pledge of independence. The Indian flag replaces the Union Jack. In that single, breathless moment, India is free.'
            color="#FFFFFF"
            big
          />

          {/* Dawn — 15 August 1947 */}
          <StoryBlock
            scrollProgress={scrollYProgress}
            range={[0.65, 0.85]}
            time="15 August 1947"
            timeLabel="Dawn"
            title="A New Sun Rises Over India"
            text="The morning of 15 August 1947 breaks over a free nation. At the Red Fort in Delhi, Prime Minister Jawaharlal Nehru hoists the Tiranga — the saffron, white, and green that millions have given their lives to see fly. Across India, people gather at flag-hoisting ceremonies, sing 'Vande Mataram', and weep with joy. Schools, villages, and cities erupt in celebration. A new nation, born of sacrifice and salt, takes its first breath. The world's largest democracy has arrived."
            color="#138808"
          />

          {/* Glowing Tiranga reveal */}
          <motion.div
            style={{ opacity: glowOpacity }}
            className="relative flex flex-col items-center text-center pt-12"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="absolute inset-0 blur-3xl opacity-60">
                <WavingFlag height={280} className="w-[320px] sm:w-[420px]" />
              </div>
              <WavingFlag height={280} className="w-[320px] sm:w-[420px] relative" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mt-10"
            >
              <p className="font-deva text-2xl text-saffron text-glow-saffron">
                आज़ाद भारत
              </p>
              <p className="font-serif text-4xl sm:text-5xl font-bold gold-text mt-3 tracking-wider">
                FREE INDIA
              </p>
              <p className="mt-4 text-sm text-white/60 max-w-xl mx-auto leading-relaxed">
                The tricolour now flies over a sovereign nation. The long night is over. The journey of a free people begins.
              </p>
            </motion.div>

            <div className="mt-12 flex gap-6 text-chakra-blue-light">
              <AshokaChakra size={50} spinDuration={20} />
              <AshokaChakra size={70} spinDuration={14} reverse />
              <AshokaChakra size={50} spinDuration={20} />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

function StoryBlock({
  scrollProgress,
  range,
  time,
  timeLabel,
  title,
  text,
  color,
  big = false,
}: {
  scrollProgress: any;
  range: [number, number];
  time: string;
  timeLabel: string;
  title: string;
  text: string;
  color: string;
  big?: boolean;
}) {
  const opacity = useTransform(scrollProgress, [range[0] - 0.05, range[0], range[1], range[1] + 0.05], [0.3, 1, 1, 0.3]);
  const y = useTransform(scrollProgress, [range[0] - 0.05, range[0], range[1], range[1] + 0.05], [40, 0, 0, -40]);

  return (
    <motion.div style={{ opacity, y }} className="relative text-center max-w-3xl mx-auto">
      <motion.div
        initial={{ scale: 0.95 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="inline-block"
      >
        <div
          className="font-mono text-xs sm:text-sm uppercase tracking-[0.4em] mb-3"
          style={{ color }}
        >
          {time} · {timeLabel}
        </div>
        <h3
          className={`font-serif font-bold mb-6 ${big ? "text-3xl sm:text-4xl md:text-5xl" : "text-2xl sm:text-3xl"}`}
          style={{ color, textShadow: `0 0 30px ${color}60` }}
        >
          {title}
        </h3>
        <p className="text-sm sm:text-base md:text-lg text-white/80 leading-relaxed">
          {text}
        </p>
      </motion.div>
    </motion.div>
  );
}

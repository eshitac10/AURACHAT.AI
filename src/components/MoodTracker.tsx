import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { SentimentData } from '../types';
import { Sparkles, Activity, Compass, Heart, Smile, Sun, ArrowLeft } from 'lucide-react';

interface MoodTrackerProps {
  history: SentimentData[];
  theme?: string;
  onBack?: () => void;
}

export const MoodTracker: React.FC<MoodTrackerProps> = ({ history, theme = 'light', onBack }) => {
  const currentMood = useMemo<SentimentData>(() => {
    if (history.length === 0) {
      return {
        emotion: 'Calm',
        score: 75,
        color: '#8b5cf6', // Indigo/violet
        insight: 'No conversations analyzed yet. Start chatting with AuraChat to explore your mind!',
        recommendation: 'Type any message in the chat box. AuraChat will analyze your creative wave.'
      };
    }
    return history[history.length - 1];
  }, [history]);

  // SVG Chart calculation for the sentiment scores
  const chartPoints = useMemo(() => {
    if (history.length < 2) return '';
    const width = 500;
    const height = 150;
    const padding = 20;

    const xStep = (width - padding * 2) / (history.length - 1);
    return history
      .map((item, index) => {
        const x = padding + index * xStep;
        // Invert Y so higher scores are at the top
        const y = height - padding - (item.score / 100) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }, [history]);

  // Icons based on emotion
  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'Zen':
        return <Compass className="w-8 h-8 text-indigo-500" />;
      case 'Creative':
        return <Sparkles className="w-8 h-8 text-pink-500 animate-pulse" />;
      case 'Excited':
        return <Sun className="w-8 h-8 text-amber-500" />;
      case 'Joyful':
        return <Smile className="w-8 h-8 text-emerald-500" />;
      case 'Calm':
        return <Heart className="w-8 h-8 text-violet-500 animate-pulse" />;
      default:
        return <Activity className="w-8 h-8 text-cyan-500" />;
    }
  };

  const styles = useMemo(() => {
    if (theme === 'dark') {
      return {
        bg: 'bg-zinc-900 border-zinc-800 text-zinc-100',
        sparkle: 'text-violet-400',
        cardBg: 'bg-zinc-950/40 border-zinc-800/80',
        subHeading: 'text-zinc-500 font-mono font-bold',
        catalystText: 'text-zinc-300',
        indicator: 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_8px_rgba(139,92,246,0.15)]',
        indicatorBullet: 'bg-violet-500',
      };
    } else if (theme === 'pink') {
      return {
        bg: 'bg-white dark:bg-[#1a0a16] border border-zinc-200/80 dark:border-pink-900/30 shadow-sm text-pink-950 dark:text-pink-50',
        sparkle: 'text-pink-500',
        cardBg: 'bg-zinc-50 dark:bg-black/30 border border-zinc-200/60 dark:border-pink-900/20',
        subHeading: 'text-pink-500/60 font-mono',
        catalystText: 'text-zinc-600 dark:text-pink-300',
        indicator: 'bg-pink-100 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400 border border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.15)]',
        indicatorBullet: 'bg-pink-500',
      };
    } else {
      // Light Mode
      return {
        bg: 'bg-white border-zinc-200 shadow-sm text-zinc-800',
        sparkle: 'text-zinc-500',
        cardBg: 'bg-zinc-50 border-zinc-200',
        subHeading: 'text-zinc-400 font-mono',
        catalystText: 'text-zinc-600',
        indicator: 'bg-zinc-100 text-zinc-700 border border-zinc-200',
        indicatorBullet: 'bg-zinc-500',
      };
    }
  }, [theme]);

  return (
    <div className={`flex flex-col gap-6 p-6 rounded-2xl border ${styles.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800/50 transition-colors"
              title="Back to Chat"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              AI Aura & Mood Sentiment <Activity className={`w-4 h-4 ${styles.sparkle}`} />
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Real-time neural feedback based on semantic structure
            </p>
          </div>
        </div>

        {/* Mini Active Indicator */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles.indicator}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-ping ${styles.indicatorBullet}`} />
          Neural Engine Live
        </span>
      </div>

      {/* Main Emotion Display & Aura Wave */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Wave and Circle */}
        <div className={`md:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl relative overflow-hidden ${styles.cardBg}`}>
          {/* Animated Aura Glow rings */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none transition-all duration-1000"
            style={{
              background: `radial-gradient(circle at center, ${currentMood.color} 0%, transparent 70%)`
            }}
          />

          {/* Interactive Aura Orb */}
          <motion.div
            className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-lg border-2"
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                `0 0 20px 4px ${currentMood.color}30`,
                `0 0 40px 12px ${currentMood.color}50`,
                `0 0 20px 4px ${currentMood.color}30`
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              borderColor: currentMood.color,
              backgroundColor: `${currentMood.color}15`
            }}
          >
            {getEmotionIcon(currentMood.emotion)}
          </motion.div>

          <div className="text-center mt-4 z-10">
            <h4
              className="text-xl font-black font-sans tracking-tight"
              style={{ color: currentMood.color }}
            >
              {currentMood.emotion} Aura
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              Sentiment Index: {currentMood.score}/100
            </p>
          </div>
        </div>

        {/* Right Side: Insights and Recommendations */}
        <div className={`md:col-span-7 flex flex-col justify-between p-6 rounded-xl ${styles.cardBg}`}>
          <div className="space-y-4">
            <div>
              <span className={`text-[10px] uppercase font-mono font-bold tracking-wider ${styles.subHeading}`}>
                Cognitive Reflection
              </span>
              <p className="text-sm font-medium leading-relaxed mt-1">
                "{currentMood.insight}"
              </p>
            </div>

            <div>
              <span className={`text-[10px] uppercase font-mono font-bold tracking-wider ${styles.sparkle}`}>
                Creative Catalyst
              </span>
              <p className={`text-xs mt-1 leading-relaxed ${styles.catalystText}`}>
                {currentMood.recommendation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Flow SVG Sparkline Chart */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold uppercase font-mono ${styles.subHeading}`}>
            Emotional Journey Over Time
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {history.length} samples analyzed
          </span>
        </div>

        <div className={`h-40 w-full rounded-xl p-2 relative flex items-center justify-center ${styles.cardBg}`}>
          {history.length < 2 ? (
            <div className="text-center p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Need at least 2 chat interactions to plot your aura wave chart.
              </p>
            </div>
          ) : (
            <div className="w-full h-full relative">
              <svg
                viewBox="0 0 500 150"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="auraGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={currentMood.color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={currentMood.color} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Fill Area */}
                {chartPoints && (
                  <path
                    d={`M 20,130 L ${chartPoints} L 480,130 Z`}
                    fill="url(#auraGradient)"
                    className="transition-all duration-500"
                  />
                )}

                {/* Path Line */}
                {chartPoints && (
                  <motion.path
                    d={`M ${chartPoints}`}
                    fill="none"
                    stroke={currentMood.color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                  />
                )}

                {/* Draw markers */}
                {history.map((item, index) => {
                  const xStep = (500 - 40) / (history.length - 1);
                  const x = 20 + index * xStep;
                  const y = 150 - 20 - (item.score / 100) * 110;
                  return (
                    <g key={index} className="group cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r="5"
                        fill={item.color}
                        stroke="#fff"
                        strokeWidth="2"
                        className="transition-all duration-300 group-hover:r-7"
                      />
                      <title>{`${item.emotion}: ${item.score}`}</title>
                    </g>
                  );
                })}
              </svg>

              {/* Grid Y labels */}
              <div className="absolute left-2 top-2 text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">High</div>
              <div className="absolute left-2 bottom-2 text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">Calm</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

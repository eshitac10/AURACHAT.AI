import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Badge } from '../types';
import { Award, Lock, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';

interface BadgeTrackerProps {
  badges: Badge[];
  xp: number;
  theme?: string;
  onBack?: () => void;
}

export const BadgeTracker: React.FC<BadgeTrackerProps> = ({ badges, xp, theme = 'light', onBack }) => {
  // Calculate Level based on XP (e.g., Level 1 = 0-99 XP, Level 2 = 100-199 XP, Level 3 = 200+ XP)
  const currentLevel = useMemo(() => {
    return Math.floor(xp / 100) + 1;
  }, [xp]);

  const xpProgress = useMemo(() => {
    return xp % 100;
  }, [xp]);

  const unlockedCount = useMemo(() => {
    return badges.filter((b) => b.unlocked).length;
  }, [badges]);

  const styles = useMemo(() => {
    if (theme === 'dark') {
      return {
        bg: 'bg-zinc-900 border-zinc-800 text-zinc-100',
        borderBottom: 'border-zinc-800/80',
        levelBg: 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_12px_rgba(124,58,237,0.35)]',
        sparkleText: 'text-violet-400',
        progressBarBg: 'bg-zinc-950/40',
        progressBarFill: 'bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-600',
        textXp: 'text-violet-400 font-bold',
        gridHeading: 'text-zinc-500 font-bold',
        cardActive: 'bg-zinc-800/60 border-zinc-700/60 hover:shadow-md shadow-sm text-zinc-100',
        cardInactive: 'bg-zinc-900/40 border-zinc-800/40 opacity-60 text-zinc-400',
        iconActive: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
        iconInactive: 'bg-zinc-950/30 border-zinc-800/30 text-zinc-600',
        xpBadgeActive: 'bg-emerald-500/10 text-emerald-400',
        xpBadgeInactive: 'bg-zinc-950/40 border border-zinc-800/40 text-zinc-500',
        glowHint: 'bg-violet-500/5',
      };
    } else if (theme === 'pink') {
      return {
        bg: 'bg-[#1a0a16] border-pink-900/30 shadow-sm text-pink-50',
        borderBottom: 'border-pink-900/30',
        levelBg: 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-[0_0_15px_rgba(236,72,153,0.4)]',
        sparkleText: 'text-pink-500',
        progressBarBg: 'bg-black/30',
        progressBarFill: 'bg-gradient-to-r from-rose-500 via-pink-500 to-violet-600',
        textXp: 'text-pink-600 dark:text-pink-400 font-bold',
        gridHeading: 'text-pink-500/60 font-mono',
        cardActive: 'bg-white dark:bg-black/30 border-pink-200 dark:border-pink-900/40 shadow-sm hover:shadow-md text-pink-950 dark:text-pink-100',
        cardInactive: 'bg-zinc-100/50 dark:bg-black/20 border-zinc-200 dark:border-pink-950/20 opacity-75 text-pink-900/50 dark:text-pink-400/50',
        iconActive: 'bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-violet-500/10 border-pink-200 dark:border-pink-800/30 text-pink-600 dark:text-pink-400 shadow-sm',
        iconInactive: 'bg-zinc-200/50 dark:bg-[#1a0a16] border-zinc-300 dark:border-pink-900/20 text-zinc-400 dark:text-pink-900/60',
        xpBadgeActive: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        xpBadgeInactive: 'bg-zinc-200 dark:bg-[#1a0a16] border dark:border-pink-900/20 text-zinc-500 dark:text-pink-400/50',
        glowHint: 'bg-pink-500/5',
      };
    } else {
      // Light Mode
      return {
        bg: 'bg-zinc-50 border-zinc-200 shadow-sm text-zinc-800',
        borderBottom: 'border-zinc-200',
        levelBg: 'bg-gradient-to-br from-zinc-700 to-zinc-900 shadow-sm',
        sparkleText: 'text-zinc-500',
        progressBarBg: 'bg-zinc-200',
        progressBarFill: 'bg-gradient-to-r from-zinc-500 to-zinc-800',
        textXp: 'text-zinc-800 font-bold',
        gridHeading: 'text-zinc-400 font-mono',
        cardActive: 'bg-white border-zinc-200 shadow-sm hover:shadow-md text-zinc-800',
        cardInactive: 'bg-zinc-100/50 border-zinc-200 opacity-70 text-zinc-500',
        iconActive: 'bg-zinc-100 border-zinc-200 text-zinc-800',
        iconInactive: 'bg-zinc-100/60 border-zinc-200/30 text-zinc-400',
        xpBadgeActive: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        xpBadgeInactive: 'bg-zinc-100 text-zinc-400',
        glowHint: 'bg-zinc-500/5',
      };
    }
  }, [theme]);

  return (
    <div className={`flex flex-col h-full p-6 rounded-2xl border ${styles.bg}`}>
      {/* Header Profile Section */}
      <div className={`flex flex-col gap-4 border-b pb-6 mb-6 ${styles.borderBottom}`}>
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800/50 transition-colors"
              title="Back to Chat"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="relative">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl ${styles.levelBg}`}>
              {currentLevel}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-950">
              LVL
            </span>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold flex items-center gap-2">
              Explorer Journey <Sparkles className={`w-4 h-4 animate-pulse ${styles.sparkleText}`} />
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Unlocked {unlockedCount} of {badges.length} cosmic rewards
            </p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-500 dark:text-zinc-400">Level {currentLevel}</span>
            <span className={styles.textXp}>{xp} XP Total ({xpProgress}/100)</span>
            <span className="text-zinc-500 dark:text-zinc-400">Level {currentLevel + 1}</span>
          </div>
          <div className={`h-3 w-full rounded-full overflow-hidden ${styles.progressBarBg}`}>
            <motion.div
              className={`h-full rounded-full ${styles.progressBarFill}`}
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="flex-grow overflow-y-auto pr-1 space-y-4 max-h-[420px] scrollbar-thin">
        <h4 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${styles.gridHeading}`}>
          Unlockable Accomplishments
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {badges.map((badge) => (
            <motion.div
              key={badge.id}
              whileHover={{ y: -2 }}
              className={`flex gap-3 p-4 rounded-xl border transition-all relative overflow-hidden ${
                badge.unlocked ? styles.cardActive : styles.cardInactive
              }`}
            >
              {/* Background gradient hint for unlocked ones */}
              {badge.unlocked && (
                <div className={`absolute top-0 right-0 w-12 h-12 rounded-bl-full pointer-events-none ${styles.glowHint}`} />
              )}

              {/* Badge Icon Slot */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                  badge.unlocked ? styles.iconActive : styles.iconInactive
                }`}
              >
                {badge.unlocked ? (
                  <Award className="w-6 h-6 animate-pulse" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>

              {/* Badge info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-bold truncate">
                    {badge.name}
                  </h5>
                  {badge.unlocked && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal mt-1">
                  {badge.description}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                    badge.unlocked ? styles.xpBadgeActive : styles.xpBadgeInactive
                  }`}>
                    +{badge.xpReward} XP
                  </span>
                  {badge.unlocked && badge.unlockedAt && (
                    <span className="text-[9px] text-zinc-400 font-mono">
                      {new Date(badge.unlockedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

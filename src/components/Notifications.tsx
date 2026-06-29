import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppNotification } from '../types';
import { Bell, Award, User, ShieldAlert, Sparkles, X } from 'lucide-react';

interface NotificationsProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationsList: React.FC<NotificationsProps> = ({ notifications, onDismiss }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'badge':
        return <Award className="w-5 h-5 text-yellow-400" />;
      case 'user':
        return <User className="w-5 h-5 text-cyan-400" />;
      case 'error':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'success':
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
      default:
        return <Bell className="w-5 h-5 text-violet-400" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.slice(-5).map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-white/90 dark:bg-zinc-900/90 shadow-lg backdrop-blur-md border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {notification.title}
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-normal">
                {notification.message}
              </p>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 block font-mono">
                {notification.timestamp}
              </span>
            </div>
            <button
              onClick={() => onDismiss(notification.id)}
              className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

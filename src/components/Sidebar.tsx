import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChatSession } from '../types';
import {
  MessageSquare,
  Plus,
  Moon,
  Sun,
  Palette,
  Shield,
  Key,
  Trash2,
  Lock,
  Unlock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  theme: 'light' | 'dark' | 'pink';
  onSetTheme: (theme: 'light' | 'dark' | 'pink') => void;
  passcode: string;
  onSetPasscode: (pass: string) => void;
  isE2eeEnabled: boolean;
  onToggleE2ee: (val: boolean) => void;
  userName: string;
  onSetUserName: (name: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  theme,
  onSetTheme,
  passcode,
  onSetPasscode,
  isE2eeEnabled,
  onToggleE2ee,
  userName,
  onSetUserName
}) => {
  const [showPasscodeForm, setShowPasscodeForm] = useState(false);
  const [tempPass, setTempPass] = useState(passcode);

  const sidebarStyles = React.useMemo(() => {
    if (theme === 'dark') {
      return {
        bg: 'bg-zinc-900 border-zinc-800 text-zinc-100',
        headerBorder: 'border-zinc-800',
        userBg: 'bg-zinc-950/40 border-zinc-800/80',
        userLabel: 'text-violet-400',
        input: 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:ring-violet-500/40',
        itemActive: 'bg-zinc-800 border border-zinc-700 text-zinc-100 shadow-sm',
        itemHover: 'hover:bg-zinc-800/60 text-zinc-300',
        label: 'text-zinc-500 font-bold uppercase tracking-widest',
        sectionBorder: 'border-zinc-800/60',
        lockBtnActive: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm',
        lockBtnInactive: 'bg-zinc-950/20 text-zinc-500 border border-zinc-800/20',
        colorEcosystemBg: 'bg-zinc-950/40',
        tabActive: 'bg-zinc-800 text-white border border-zinc-700 shadow-sm',
        tabInactive: 'text-zinc-400 hover:text-white hover:bg-zinc-800/50',
        logoBg: 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_10px_rgba(124,58,237,0.3)]',
        brandAccent: 'text-violet-400',
        tagline: 'text-violet-500/60 font-mono tracking-widest uppercase mt-0.5 block text-[9px] font-bold',
        newThreadBtn: 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300',
        bulletActive: 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]',
        bulletInactive: 'bg-zinc-700',
        trashBtn: 'text-zinc-400 hover:text-rose-500',
        shieldInactive: 'text-zinc-600',
      };
    } else if (theme === 'pink') {
      return {
        bg: 'bg-[#1a0a16] border-pink-900/40 text-pink-50',
        headerBorder: 'border-pink-900/40',
        userBg: 'bg-pink-950/10 border-pink-900/30',
        userLabel: 'text-pink-400',
        input: 'bg-black/40 border-pink-900/30 text-pink-50 placeholder:text-pink-900/60 focus:ring-pink-500/40',
        itemActive: 'bg-pink-500/10 border border-pink-500/20 text-pink-50 shadow-[0_0_15px_rgba(236,72,153,0.15)]',
        itemHover: 'hover:bg-white/5 text-pink-200/60',
        label: 'text-pink-500/60 font-bold uppercase tracking-widest',
        sectionBorder: 'border-pink-900/30',
        lockBtnActive: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
        lockBtnInactive: 'bg-pink-950/20 text-pink-500/60 border border-pink-900/20',
        colorEcosystemBg: 'bg-black/30',
        tabActive: 'bg-pink-500/20 text-pink-400 border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]',
        tabInactive: 'text-pink-300/40 hover:text-pink-200 hover:bg-pink-500/5',
        logoBg: 'bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.4)]',
        brandAccent: 'text-pink-500',
        tagline: 'text-pink-500 font-mono tracking-widest uppercase mt-0.5 block text-[9px] font-bold',
        newThreadBtn: 'bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-500',
        bulletActive: 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]',
        bulletInactive: 'bg-pink-900/60',
        trashBtn: 'text-pink-400 hover:text-rose-500',
        shieldInactive: 'text-pink-500/40',
      };
    } else {
      // Light Mode
      return {
        bg: 'bg-zinc-50 border-zinc-200 text-zinc-900',
        headerBorder: 'border-zinc-200',
        userBg: 'bg-zinc-100/50 border-zinc-200/80',
        userLabel: 'text-zinc-500',
        input: 'bg-white border-zinc-200 text-zinc-900 focus:ring-zinc-400',
        itemActive: 'bg-white shadow-sm border border-zinc-200 text-zinc-800',
        itemHover: 'hover:bg-zinc-100 text-zinc-600',
        label: 'text-zinc-400 font-bold uppercase tracking-widest',
        sectionBorder: 'border-zinc-200',
        lockBtnActive: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        lockBtnInactive: 'bg-zinc-100 text-zinc-400',
        colorEcosystemBg: 'bg-zinc-100',
        tabActive: 'bg-zinc-900 text-white shadow-sm',
        tabInactive: 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60',
        logoBg: 'bg-gradient-to-br from-zinc-700 to-zinc-900 shadow-sm',
        brandAccent: 'text-zinc-800',
        tagline: 'text-zinc-400 font-mono tracking-widest uppercase mt-0.5 block text-[9px] font-bold',
        newThreadBtn: 'bg-zinc-200 hover:bg-zinc-300 border border-zinc-300 text-zinc-700',
        bulletActive: 'bg-zinc-800 shadow-[0_0_6px_rgba(0,0,0,0.15)]',
        bulletInactive: 'bg-zinc-300',
        trashBtn: 'text-zinc-400 hover:text-rose-600',
        shieldInactive: 'text-zinc-300',
      };
    }
  }, [theme]);

  const savePasscode = () => {
    onSetPasscode(tempPass);
    if (tempPass) {
      onToggleE2ee(true);
    } else {
      onToggleE2ee(false);
    }
    setShowPasscodeForm(false);
  };

  return (
    <div className={`w-80 h-full flex flex-col border-r shrink-0 select-none ${sidebarStyles.bg} ${sidebarStyles.headerBorder}`}>
      {/* Brand Header */}
      <div className={`p-4 border-b flex items-center justify-between ${sidebarStyles.headerBorder}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sidebarStyles.logoBg}`}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider font-sans leading-none">
              AuraChat<span className={sidebarStyles.brandAccent}>.ai</span>
            </h1>
            <span className={sidebarStyles.tagline}>
              Secure Studio
            </span>
          </div>
        </div>
      </div>

      {/* User Info config */}
      <div className={`px-4 py-3 border-b space-y-1 ${sidebarStyles.headerBorder} ${sidebarStyles.userBg}`}>
        <label className={`text-[10px] font-mono ${sidebarStyles.userLabel}`}>
          User Handle
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => onSetUserName(e.target.value.substring(0, 15))}
          className={`w-full text-xs font-semibold px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 ${sidebarStyles.input}`}
          placeholder="Anonymous Explorer"
        />
      </div>

      {/* Sessions Controls */}
      <div className="p-4 flex flex-col gap-2 flex-grow overflow-y-auto">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-mono ${sidebarStyles.label}`}>
            History ({sessions.length})
          </span>
          <button
            onClick={onNewSession}
            className={`p-1 rounded-md transition-colors ${sidebarStyles.newThreadBtn}`}
            title="Start new chat thread"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-grow space-y-1 overflow-y-auto max-h-[220px] pr-1">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  isActive ? sidebarStyles.itemActive : sidebarStyles.itemHover
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 transition-all ${
                    isActive ? sidebarStyles.bulletActive : sidebarStyles.bulletInactive
                  }`}></span>
                  <span className="text-xs truncate">
                    {session.title || 'Untitled Thread'}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all shrink-0 ${sidebarStyles.trashBtn}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security E2EE Controls */}
      <div className={`p-4 border-t space-y-3 ${sidebarStyles.sectionBorder}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className={`w-4 h-4 ${isE2eeEnabled ? 'text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : sidebarStyles.shieldInactive}`} />
            <span className="text-xs font-semibold">
              End-to-End Encryption
            </span>
          </div>
          <button
            onClick={() => {
              if (isE2eeEnabled) {
                onToggleE2ee(false);
                onSetPasscode('');
                setTempPass('');
              } else {
                setShowPasscodeForm(true);
              }
            }}
            className={`p-1 rounded-md transition-all border ${
              isE2eeEnabled ? sidebarStyles.lockBtnActive : sidebarStyles.lockBtnInactive
            }`}
          >
            {isE2eeEnabled ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showPasscodeForm ? (
          <div className={`space-y-2 p-2 rounded-xl border ${sidebarStyles.userBg}`}>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
              <Key className="w-3 h-3 text-emerald-500 animate-pulse" />
              Set Private Passcode
            </div>
            <input
              type="password"
              value={tempPass}
              onChange={(e) => setTempPass(e.target.value)}
              className={`w-full text-xs font-mono p-1.5 rounded-lg focus:outline-none focus:ring-1 ${sidebarStyles.input}`}
              placeholder="e.g. MySecretSpace"
            />
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setShowPasscodeForm(false)}
                className="px-2 py-1 rounded text-[10px] font-bold text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePasscode}
                className="px-2 py-1 rounded text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all"
              >
                Secure Lock
              </button>
            </div>
          </div>
        ) : (
          isE2eeEnabled && (
            <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <p className="text-[10px] font-mono leading-relaxed text-emerald-400">
                Messages encrypted in browser using AES-256-GCM. Decrypted dynamically inside memory only.
              </p>
            </div>
          )
        )}
      </div>

      {/* Theme Controls */}
      <div className={`p-4 border-t space-y-2.5 ${sidebarStyles.sectionBorder}`}>
        <span className={`text-[10px] font-mono ${sidebarStyles.label}`}>
          Vibe Architecture
        </span>

        <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl ${sidebarStyles.colorEcosystemBg}`}>
          <button
            onClick={() => onSetTheme('light')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              theme === 'light'
                ? sidebarStyles.tabActive
                : sidebarStyles.tabInactive
            }`}
          >
            <Sun className="w-3 h-3" />
            Light
          </button>
          <button
            onClick={() => onSetTheme('dark')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              theme === 'dark'
                ? sidebarStyles.tabActive
                : sidebarStyles.tabInactive
            }`}
          >
            <Moon className="w-3 h-3" />
            Dark
          </button>
          <button
            onClick={() => onSetTheme('pink')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              theme === 'pink'
                ? sidebarStyles.tabActive
                : sidebarStyles.tabInactive
            }`}
          >
            <Palette className="w-3 h-3" />
            Pink
          </button>
        </div>
      </div>
    </div>
  );
};
